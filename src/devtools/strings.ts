import { getLang } from '@/i18n';

/**
 * Developer-panel translations. Kept apart from `src/i18n/ar.ts` on purpose: that dictionary ships to players,
 * whereas these strings must exist only in development builds.
 */
const AR: Record<string, string> = {
  'DEV': 'مطوّر', 'DEV SANDBOX': 'صندوق المطوّر',
  'Sandbox: saves are disabled, your real save is untouched.': 'صندوق الاختبار: الحفظ معطّل وحفظك الحقيقي لم يُمس.',
  'Exit sandbox (reload)': 'الخروج من الصندوق (إعادة تحميل)',
  'Status': 'الحالة', 'Stage': 'المرحلة', 'Boss': 'الزعيم', 'Boss state': 'حالة الزعيم', 'Player HP': 'صحة اللاعب', 'Player state': 'حالة اللاعب', 'Position': 'الموقع',
  'Stage Navigation': 'التنقل بين المراحل', 'Boss Selection': 'اختيار الزعيم', 'Player Testing': 'اختبار اللاعب', 'Progress Management': 'إدارة التقدّم',
  'Prev': 'السابق', 'Next': 'التالي', 'Reset stage': 'إعادة المرحلة',
  'Restore enemies, chests and the boss, restart at the entrance': 'استعادة الأعداء والصناديق والزعيم والبدء من المدخل',
  'Fight': 'قتال', 'Teleport into the arena and start the fight': 'انتقل إلى الساحة وابدأ القتال',
  'Defeat boss now': 'اهزم الزعيم الآن', 'Boss defeated': 'هُزم الزعيم', 'No active boss here': 'لا يوجد زعيم نشط هنا',
  'God mode': 'وضع الإله', 'Infinite health': 'صحة لا نهائية', 'Unlock all stages': 'فتح كل المراحل', 'Heal': 'علاج', 'Restore normal': 'استعادة الوضع العادي',
  'Normal gameplay restored': 'تمت استعادة اللعب العادي',
  'Reset enemy kills': 'إعادة قتلى الأعداء', 'Respawn every enemy of the current stage (sandbox only)': 'إعادة ظهور كل أعداء المرحلة الحالية (في الصندوق فقط)',
  'Sandbox ← save copy': 'الصندوق ← نسخة من الحفظ', 'Copies your save into the sandbox; the save itself is not modified': 'ينسخ حفظك إلى الصندوق دون تعديل الحفظ نفسه',
  'Loaded copy of your save': 'تم تحميل نسخة من حفظك', 'No save found': 'لا يوجد حفظ',
  'Reset sandbox progress': 'إعادة تقدّم الصندوق', 'Reset SANDBOX progress to a new game? Your real save is not affected.': 'إعادة تقدّم الصندوق إلى لعبة جديدة؟ حفظك الحقيقي لن يتأثر.',
  'Wipe REAL save…': 'حذف الحفظ الحقيقي…', 'DELETE your real save slots permanently?': 'حذف خانات حفظك الحقيقية نهائيًا؟',
  'Really delete ALL saved progress? This cannot be undone.': 'هل تريد فعلًا حذف كل التقدّم المحفوظ؟ لا يمكن التراجع.',
  'defeated': 'مهزوم', 'none here': 'لا يوجد هنا', 'fighting': 'يقاتل', 'waiting': 'ينتظر', 'dead': 'ميت', 'phase': 'طور',
  'Idle': 'خامل', 'Moving': 'يتحرك', 'Jumping': 'يقفز', 'Falling': 'يسقط', 'Attacking': 'يهاجم', 'Blocking': 'يصدّ',
  'Dodging': 'يراوغ', 'Dashing': 'يندفع', 'TakingDamage': 'يتلقى ضررًا', 'Dead': 'ميت',
};

/** Developer-panel translate: English text is the key; unknown strings fall back to English. */
export function dt(text: string): string {
  return getLang() === 'ar' ? (AR[text] ?? text) : text;
}
export const DEV_AR = AR;
