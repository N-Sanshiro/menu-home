async function loadMenus() {
  const container = document.getElementById('menu-container');
  try {
    const res = await fetch('public/menu.json');
    const menus = await res.json();

    if (!Array.isArray(menus) || menus.length === 0) {
      container.innerHTML = '<p>メニューが存在しません。</p>';
      return;
    }

    container.innerHTML = '';
    menus.forEach(menu => {
      const div = document.createElement('div');
      div.className = 'menu-button';
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
            ? '<button onclick="alert(\'購入しました\')" class="buy-button">購入する</button>'
            : '<button type="button" disabled class="buy-button soldout-btn">売り切れ</button>'}
        </div>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error("メニューの読み込み中にエラーが発生しました:", error); // エラーの詳細をコンソールに出力
    container.innerHTML = '<p>読み込みエラーが発生しました。</p>';
  }
}

function toggleBuyButton(id) {
  const all = document.querySelectorAll('[id^="buyForm-"]');
  all.forEach(f => f.style.display = 'none');
  const form = document.getElementById('buyForm-' + id);
  form.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', loadMenus);