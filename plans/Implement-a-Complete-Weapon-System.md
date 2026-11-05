# Implement a Complete Weapon System for Stickman

I want you to implement a complete, production-quality weapon system in the existing Stickman game.

This is an implementation task. Inspect the current combat, player controller, animations, save system, inventory, quests, chests, boss rewards, World Packs, UI, and audio architecture before making changes.

You are authorized to modify and refactor the necessary code.

The goal is to introduce a meaningful weapon system with:

- Normal attacks.
- Weapon-specific combos.
- Special abilities.
- Weapon switching through both Inventory and quick switching during gameplay.
- Weapons obtained from boss rewards, treasure chests, and quests.
- Weapon progression and upgrades.
- Persistent weapon ownership, equipment, and upgrade levels.

The system must integrate with the existing game architecture and support all 10 planned worlds.

Do not implement weapons as cosmetic skins. Every weapon must have genuinely different combat behavior.

---

# 1. First: Inspect the Existing Combat Architecture

Before implementation, inspect:

- Player movement and combat controllers.
- Current attack and damage systems.
- Enemy damage and hit detection.
- Boss combat and attack patterns.
- Animation and sprite systems.
- Input handling for keyboard and touch.
- Inventory and equipment systems.
- Quest rewards and quest progression.
- Chest and collectible reward logic.
- Boss defeat and campaign progression.
- Save serialization and migration.
- Audio manager.
- Arabic and English localization.

Reuse existing systems wherever practical.

Do not create a second independent combat system that conflicts with the current one.

The existing combat must continue working throughout the implementation.

# 2. Weapon Categories

Implement at least these six weapon categories:

## Sword — السيف

Combat identity: Balanced melee weapon.

- Medium attack speed.
- Medium damage.
- Balanced attack range.
- Reliable basic combo chain.
- Special ability: powerful forward slash that hits multiple enemies.

## Dual Daggers — الخناجر المزدوجة

Combat identity: Fast close-range combat.

- Very fast attacks.
- Lower damage per hit.
- Longer combo chains.
- Short attack range.
- Special ability: rapid multi-hit dash attack.
- Strong against enemies that are vulnerable to repeated hits.

## Battle Axe — الفأس الحربي

Combat identity: Heavy damage and armor breaking.

- Slow attacks.
- High damage.
- Short-to-medium range.
- Heavy attacks can break shield defenses.
- Special ability: powerful ground slam with an area-of-effect impact.

## Spear — الرمح

Combat identity: Reach and spacing.

- Long attack range.
- Medium attack speed.
- Medium damage.
- Thrust-based combo chains.
- Special ability: piercing attack that can hit multiple enemies in a line.

## Magic Staff — العصا السحرية

Combat identity: Ranged elemental combat.

- Ranged basic attacks.
- Uses a resource such as mana or energy.
- Different elemental effects depending on the weapon.
- Special ability: elemental projectile or area attack.
- Keep resource consumption balanced and readable.

## War Hammer — المطرقة الحربية

Combat identity: Heavy crowd control.

- Very slow attacks.
- Very high impact damage.
- Short range.
- Can stagger or interrupt appropriate enemies.
- Special ability: ground shockwave that affects nearby enemies.

These six are the initial weapon families.

The architecture must also support additional unique weapons introduced by future World Packs without requiring changes to the core combat engine.

# 3. Weapon Data Architecture

Create a data-driven weapon definition system.

Each weapon definition should support:

- Unique weapon ID.
- Display name.
- Description.
- Weapon category.
- Icon.
- World of origin.
- Damage values.
- Attack speed.
- Attack range.
- Combo definitions.
- Animation references.
- Hitbox configuration.
- Special ability definition.
- Resource consumption.
- Cooldowns.
- Upgrade levels.
- Upgrade costs.
- Sound effects.
- Visual effects.
- Unlock requirements.
- Rarity.
- Localization keys.

Keep weapon definitions separate from combat execution.

The combat engine should consume weapon definitions instead of relying on hardcoded weapon-name checks.

Use strict TypeScript types and runtime validation.

Avoid using unrestricted `any` types or weakening existing type checks.

# 4. Weapon-Specific Combat

## Normal attacks

Each weapon must have its own normal attack behavior.

Differences must include:

- Attack speed.
- Damage.
- Reach.
- Attack animation.
- Hitbox shape and timing.
- Recovery time.
- Knockback.
- Combo timing.

Do not simply change damage values while keeping identical animations and attack behavior.

## Combos

Implement weapon-specific combo chains.

Requirements:

- Support multiple consecutive attacks.
- Each weapon should have a distinctive combo sequence.
- Allow input buffering within a reasonable window.
- Prevent attacks from overlapping incorrectly.
- Reset the combo after the appropriate timeout.
- Interrupt combos when the player is stunned, knocked back, or otherwise unable to attack.
- Make combos responsive and consistent.

The player should feel that each weapon has a different fighting style.

## Special abilities

Each weapon must have at least one unique special ability.

Requirements:

- Dedicated input action.
- Cooldown system.
- Clear visual telegraph and effects.
- Appropriate sound effects.
- Damage and hit detection integrated with the existing combat system.
- Resource consumption when applicable.
- Correct interaction with bosses and normal enemies.
- Prevent ability spam.
- Show cooldown feedback in the UI.

Special abilities must not bypass existing boss combat rules or damage validation.

# 5. Weapon Unlocking and Rewards

Weapons must be obtainable through three existing gameplay systems.

## Boss rewards

- Bosses can reward unique weapons.
- Each world should have at least one meaningful weapon reward associated with its boss.
- Boss rewards must be granted only once.
- Defeating a boss again must not duplicate the weapon.
- Reward ownership must persist after restarting the game.

Do not make every boss drop the same weapon.

Design a meaningful reward progression across the 10 worlds.

## Treasure chests

- Add weapon rewards to selected treasure chests.
- Use existing chest interaction and reward logic.
- Ensure weapon rewards are granted only once.
- Prevent duplicated rewards after scene transitions or save reloads.
- Display an appropriate reward notification.

## Quests

- Allow quests to reward weapons.
- Support weapon rewards in the existing quest reward definitions.
- Grant rewards only after successful quest completion.
- Preserve the existing quest ordering and unlock system.
- Display the weapon reward in quest details and completion notifications.

## Reward consistency

Use one centralized reward-granting mechanism.

Boss rewards, chest rewards, and quest rewards must not implement separate ownership logic.

The same reward must never be granted twice because of repeated events, scene restarts, or save reloads.

# 6. Inventory and Equipment UI

Add a proper Weapons section to the existing Inventory.

Display:

- Owned weapons.
- Locked weapons.
- Currently equipped weapon.
- Weapon category.
- Damage.
- Attack speed.
- Range.
- Special ability.
- Upgrade level.
- Rarity.
- Unlock source.
- Weapon description.

Requirements:

- Equip owned weapons.
- Unequip or replace the currently equipped weapon safely.
- Compare the selected weapon with the currently equipped weapon.
- Clearly distinguish owned, equipped, and locked states.
- Display unlock requirements for locked weapons.
- Show upgrade options and costs.
- Prevent equipping weapons the player does not own.
- Preserve equipment state after closing and reopening the game.

The Inventory should remain usable on desktop and mobile.

Do not redesign unrelated inventory features.

# 7. Quick Weapon Switching During Gameplay

Support both requested switching methods.

## Inventory switching

The player can equip a weapon through the Inventory menu.

## Quick switching

Implement quick weapon switching during gameplay.

Requirements:

- Provide dedicated input bindings.
- Support keyboard controls.
- Support mobile touch controls.
- Allow switching between owned weapons.
- Provide a small weapon indicator showing the currently equipped weapon.
- Display a brief weapon-switch feedback animation or effect.
- Prevent switching during invalid states, such as certain locked attack animations, if necessary.
- Do not allow switching to locked or unowned weapons.

Use the existing input architecture.

Do not hardcode keyboard behavior in the combat controller.

Allow the player to configure key bindings if the existing settings architecture supports it.

# 8. Mobile Controls

The game must remain fully playable on touch devices.

Add or integrate:

- Attack button.
- Special ability button.
- Quick weapon switch control.
- Clear cooldown feedback.
- Appropriate touch target sizes.
- No overlap with movement controls.
- Responsive placement for different mobile aspect ratios.

The controls must work in landscape mode.

Do not make mobile players rely on keyboard-only functionality.

# 9. Weapon Upgrades and Progression

Implement a simple but meaningful upgrade system.

Each weapon should support multiple upgrade levels.

Possible upgrade attributes:

- Damage.
- Attack speed.
- Special ability effectiveness.
- Resource efficiency.
- Combo effectiveness.

Requirements:

- Upgrade costs must use existing collectible resources where possible.
- Do not introduce an unnecessary new currency.
- Upgrade costs should increase gradually.
- Apply upgrades consistently to normal attacks, combos, and special abilities.
- Display current and next-level statistics.
- Prevent upgrades beyond the maximum level.
- Persist upgrade levels.
- Make upgrade purchases atomic and prevent duplicate spending.

Avoid excessive stat inflation that breaks enemy and boss balance.

# 10. Weapon Visuals and Animations

Weapons must be visually attached to the player and correctly oriented.

Requirements:

- Different weapon silhouettes.
- Appropriate hand positions and grip.
- Correct facing direction.
- Correct positioning during idle, movement, jumping, attacking, and special abilities.
- No weapon floating away from the player.
- No visual clipping that makes attacks unreadable.
- Weapon-specific attack animations or clearly differentiated animation sequences.
- Appropriate impact effects and particles.

If the game uses procedural drawing, implement distinct weapon geometry and effects.

Do not rely on recoloring one weapon shape to represent six different weapons.

Use a reusable weapon rendering architecture.

# 11. Enemy and Boss Interactions

Weapons must interact correctly with the existing enemy system.

Requirements:

- Respect enemy invulnerability windows.
- Respect shield and armor mechanics.
- Allow heavy weapons to counter appropriate defenses.
- Ensure fast weapons do not bypass damage limits.
- Ensure ranged attacks have correct collision and hit detection.
- Prevent a single attack from applying damage repeatedly because of collision overlap.
- Ensure attacks do not hit enemies behind the player unless the attack explicitly supports that behavior.

Bosses must remain fair and readable.

- Respect boss phase transitions.
- Respect boss invulnerability and telegraph states.
- Ensure weapon abilities cannot permanently stun-lock bosses.
- Balance boss damage against weapon upgrades.
- Preserve the unique mechanics of all existing bosses.

# 12. Save System and Migration

Extend the existing save profile safely.

Persist:

- Owned weapon IDs.
- Equipped weapon ID.
- Weapon upgrade levels.
- Any weapon-specific progression that is necessary.

Requirements:

- Implement a safe save migration from the current save version.
- Preserve all existing player progress.
- Existing players must receive the default starting weapon automatically.
- Existing saves must remain valid.
- Invalid or unknown weapon IDs must be handled safely.
- Never reset a player's campaign progress to initialize the weapon system.
- Ensure save/load round-trip consistency.

Use the existing save architecture rather than creating a separate weapon save file.

# 13. Audio and Feedback

Integrate with the existing AudioManager.

Add appropriate sounds for:

- Normal attacks.
- Heavy attacks.
- Combo hits.
- Special abilities.
- Weapon switching.
- Weapon unlocks.
- Weapon upgrades.

Use distinct sounds where appropriate.

Requirements:

- Respect existing mute and audio settings.
- Prevent duplicate sounds from repeated collision events.
- Avoid playing too many sounds simultaneously.
- Provide clear feedback when a weapon is unlocked or upgraded.

# 14. Balance and Progression Across 10 Worlds

Design a weapon progression plan for the 10-world campaign.

Requirements:

- The starting weapon must be available immediately.
- Players should discover new weapons gradually.
- Boss rewards should feel meaningful.
- Chest and quest rewards should complement boss rewards.
- Do not require players to obtain one specific weapon to complete a world.
- Every world must remain completable with reasonable weapon choices.
- Avoid making one weapon objectively superior in every situation.
- Upgrades must improve weapons without making later bosses trivial.

Create a documented reward distribution table showing:

- World.
- Boss reward.
- Chest weapon rewards.
- Quest weapon rewards.
- Upgrade materials or resources.

Make sure rewards are actually connected to the relevant gameplay events.

# 15. Localization and Accessibility

Support Arabic and English.

Arabic:

- Correct translations.
- RTL layout.
- Correct alignment and icon placement.
- Proper weapon names and descriptions.
- Clear upgrade and reward messages.

English:

- Complete translations.
- LTR layout.

Also:

- Use readable icons and labels.
- Do not communicate weapon stats using color alone.
- Provide clear cooldown and disabled-state feedback.
- Ensure controls are accessible on mobile.

# 16. Testing and Validation

Add automated tests for:

### Weapon definitions

- All weapon IDs are unique.
- Every weapon has valid stats.
- Every weapon has at least one normal attack.
- Every weapon has a valid combo definition.
- Every weapon has a valid special ability.
- Every weapon has valid localization keys.

### Combat

- Normal attack damage is correct.
- Combo progression and reset work.
- Input buffering works.
- Special ability cooldowns work.
- Resource consumption is correct.
- Hit detection does not apply duplicate damage.
- Weapon switching works in valid states.

### Rewards

- Boss weapon rewards are granted once.
- Chest weapon rewards are granted once.
- Quest weapon rewards are granted once.
- Repeated events do not duplicate ownership.
- Rewards persist after restart.

### Inventory

- Only owned weapons can be equipped.
- Equipped weapon persists.
- Upgrade costs are correct.
- Upgrade levels persist.
- Invalid weapon IDs are handled safely.

### Save migration

- Existing saves migrate successfully.
- Existing campaign progress remains intact.
- Existing defeated bosses and collected items remain intact.
- Default starting weapon is assigned safely.
- Save/load round trips preserve weapon state.

### Regression

- Existing movement remains functional.
- Existing attacks remain functional.
- Existing enemies remain functional.
- Existing bosses remain defeatable.
- Existing mobile controls remain functional.
- Existing quests and chest interactions remain functional.
- No regressions in campaign progression.

Run the complete Vitest suite, TypeScript type-check, production build, and relevant game smoke tests.

Do not claim tests passed unless they were actually executed.

# 17. Implementation Rules

- Inspect before modifying.
- Reuse existing architecture where appropriate.
- Keep weapon definitions data-driven.
- Keep combat execution separate from weapon data.
- Avoid duplicating damage, reward, cooldown, and save logic.
- Do not add unnecessary dependencies.
- Do not weaken TypeScript.
- Do not use mock rewards or fake combat behavior.
- Do not leave placeholder weapon assets or abilities.
- Do not change unrelated world designs.
- Preserve the existing three worlds and all current player progress.
- Ensure compatibility with the 10-world World Pack architecture.

Implement in logical phases, but complete the entire requested feature.

Do not stop after creating the weapon data model or UI. The weapons must work in actual gameplay.

# 18. Final Report

When finished, report:

1. All implemented weapons and their combat identities.
2. Normal attacks, combos, and special abilities for each weapon.
3. How quick switching works on desktop and mobile.
4. How weapons are obtained from bosses, chests, and quests.
5. Upgrade system and progression.
6. Save migration strategy.
7. Files and major architecture components changed.
8. Test commands and actual results.
9. Any remaining limitations or unfinished work.

**Final acceptance criterion:** A player must be able to obtain weapons through real gameplay, equip and switch between them, use distinct normal attacks, combos and special abilities, upgrade them, save progress, close the game, reopen it, and continue with the same weapons and equipment state.
