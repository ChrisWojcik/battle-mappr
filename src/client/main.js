import '@/lib/polyfills';
import BattleMap from '@/components/BattleMap';
import NumberInput from '@/lib/forms/NumberInput';

import '@/styles/_sanitize.scss';
import '@/styles/_global.scss';
import '@/styles/_forms.scss';

new BattleMap('test');

document.querySelectorAll('.form-number').forEach(($el) => {
  new NumberInput($el);
});
