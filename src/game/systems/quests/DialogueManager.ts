import type { DialogueView } from '@/shared/types';
import { NPCS } from '@/game/config/npcs';
import { QUESTS } from '@/game/config/quests';
import { questState } from '@/game/systems/quests/quest-engine';
import { session } from '@/game/managers/session';
import { bus } from '@/game/events/bus';
import { audio } from '@/game/managers/AudioManager';
import { t } from '@/i18n';

interface Node {
  text: string;
  /** Called when the node is advanced past. */
  after?: () => void;
  choices?: { label: string; run: () => void }[];
}

/**
 * Dialogue flow for NPCs. Content is built from quest state each time the NPC is addressed:
 * turn-in > offer > progress > idle chatter. UI reads views from the event bus.
 */
export class DialogueManager {
  private nodes: Node[] = [];
  private index = 0;
  private npcName = '';
  active = false;
  private idleCounter = 0;
  onClose?: () => void;

  open(npcId: string): void {
    const npc = NPCS[npcId];
    if (!npc) return;
    this.npcName = t(npc.name);
    const p = session.profile;
    this.nodes = [];

    const ready = npc.quests.find((id) => questState(p, QUESTS[id]) === 'ready');
    const available = npc.quests.find((id) => questState(p, QUESTS[id]) === 'available');
    const active = npc.quests.find((id) => questState(p, QUESTS[id]) === 'active');

    if (ready) {
      const q = QUESTS[ready];
      q.turnIn.forEach((raw, i) => this.nodes.push({ text: t(raw), after: i === q.turnIn.length - 1 ? () => session.completeQuest(ready) : undefined }));
    } else if (available) {
      const q = QUESTS[available];
      q.offer.forEach((raw, i) => {
        const text = t(raw);
        const last = i === q.offer.length - 1;
        this.nodes.push(last
          ? { text, choices: [{ label: t('Accept quest'), run: () => session.acceptQuest(available) }, { label: t('Not now'), run: () => undefined }] }
          : { text });
      });
    } else if (active) {
      QUESTS[active].inProgress.forEach((text) => this.nodes.push({ text: t(text) }));
    } else {
      this.nodes.push({ text: t(npc.idle[this.idleCounter++ % npc.idle.length]) });
    }
    this.index = 0;
    this.active = true;
    audio.play('ui');
    this.publish();
  }

  private publish(): void {
    if (!this.active) { bus.emit('dialogue:update', null); return; }
    const n = this.nodes[this.index];
    const view: DialogueView = {
      npcName: this.npcName,
      text: n.text,
      choices: n.choices ? n.choices.map((c) => c.label) : null,
      hasNext: this.index < this.nodes.length - 1,
    };
    bus.emit('dialogue:update', view);
  }

  advance(): void {
    if (!this.active) return;
    const n = this.nodes[this.index];
    if (n.choices) return; // must choose
    n.after?.();
    audio.play('ui');
    if (this.index >= this.nodes.length - 1) this.close();
    else { this.index++; this.publish(); }
  }

  choose(i: number): void {
    if (!this.active) return;
    const n = this.nodes[this.index];
    const c = n.choices?.[i];
    if (!c) return;
    c.run();
    this.close();
  }

  close(): void {
    if (!this.active) return;
    this.active = false;
    this.nodes = [];
    bus.emit('dialogue:update', null);
    this.onClose?.();
  }
}
