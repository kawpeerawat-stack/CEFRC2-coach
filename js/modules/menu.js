// หน้าเมนูรวมทุกโมดูล (สำหรับมือถือ)
import { h, add } from '../ui.js';
import { NAV } from '../router.js';

export const title = 'เมนู';

export async function render(root) {
  add(root,
    h('h1', {}, 'เมนูทั้งหมด'),
    h('ul', { class: 'grid list' }, NAV.map((n) => h('li', { style: 'border:0;padding:0' },
      h('a', { class: 'btn', href: n.href, style: 'width:100%;justify-content:flex-start' }, h('span', { 'aria-hidden': 'true' }, n.icon), n.label)))));
}
