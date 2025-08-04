async function loadMenus() {
  const container = document.getElementById('menu-container');
  try {
    // localStorage に保存されていればそちらを使う
    let menus = JSON.parse(localStorage.getItem('menus'));

    if (!menus) {
      const res = await fetch('public/menu.json?v=' + Date.now());
      menus = await res.json();
      // 初回読み込み時に localStorage に保存
      localStorage.setItem('menus', JSON.stringify(menus));
    }

    if (!Array.isArray(menus) || menus.length === 0) {
      container.innerHTML = '<p>メニューが存在しません。</p>';
      return;
    }

    window._menus = menus;
    container.innerHTML = '';

    menus.forEach(menu => {
      const div = document.createElement('div');
      div.className = 'menu-button';
      div.setAttribute('data-id', menu.id);
      div.onclick = () => toggleBuyButton(menu.id);

      div.innerHTML = `
        <strong>${menu.name}</strong>
        ${menu.stock >= 6
          ? '<span class="status available">〇</span>'
          : menu.stock >= 1
            ? '<span class="status few">△</span>'
            : '<span class="status soldout">×</span>'}
        <div id="buyForm-${menu.id}" style="display: none; margin-top: 10px;">
          ${menu.stock > 0
            ? `<button onclick="buyMenuFromId(${menu.id}); event.stopPropagation();" class="buy-button">購入する</button>`
            : '<button type="button" disabled class="buy-button soldout-btn">売り切れ</button>'}
        </div>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = '<p>読み込みエラーが発生しました。</p>';
    console.error('JSON読み込みエラー:', error);
  }
}

function buyMenu(menu) {
  if (menu.stock <= 0) return;
  menu.stock -= 1;
  alert('購入しました');

  // 更新された在庫を保存
  localStorage.setItem('menus', JSON.stringify(window._menus));

  const div = document.querySelector(`[data-id="${menu.id}"]`);
  if (div) {
    const statusSpan = div.querySelector('.status');
    if (statusSpan) {
      statusSpan.outerHTML = menu.stock >= 6
        ? '<span class="status available">〇</span>'
        : menu.stock >= 1
          ? '<span class="status few">△</span>'
          : '<span class="status soldout">×</span>';
    }

    const buyForm = div.querySelector(`#buyForm-${menu.id}`);
    if (buyForm) {
      buyForm.innerHTML = menu.stock > 0
        ? `<button onclick="buyMenuFromId(${menu.id}); event.stopPropagation();" class="buy-button">購入する</button>`
        : '<button type="button" disabled class="buy-button soldout-btn">売り切れ</button>';
    }
  }
}

function buyMenuFromId(id) {
  const menu = window._menus.find(m => m.id === id);
  if (menu) buyMenu(menu);
}

function toggleBuyButton(id) {
  const all = document.querySelectorAll('[id^="buyForm-"]');
  all.forEach(f => f.style.display = 'none');
  const form = document.getElementById('buyForm-' + id);
  if (form) form.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', loadMenus);

