/*
 * マーカーの上（preview ではシーンの中）に出す中身をまとめた A-Frame コンポーネント。
 *
 * index.html ではマーカーが2つ、preview.html ではマーカー無しで同じものを出すので、
 * 同じ記述を3回書かずにここに寄せている。
 *
 * ノードの座標は tools/build_model.py の NODES と同じ値。
 * glb 側には名前を焼き込まず、ラベルはこちらで a-text として重ねているので、
 * テーブル名が変わってもモデルを作り直す必要が無い。
 */
AFRAME.registerComponent('lineage-overlay', {
  schema: {
    lift: { type: 'number', default: 0.10 },   // マーカー面からの浮かせ量
    hint: { type: 'selector' }                  // マーカー発見時に隠すHTML要素（任意）
  },

  labels: [
    { t: 'ad_impressions', x: -0.72, z: -0.42 },
    { t: 'ad_clicks',      x: -0.72, z:  0.00 },
    { t: 'cost',           x: -0.72, z:  0.42 },
    { t: 'stg_events',     x:  0.00, z: -0.20 },
    { t: 'stg_cost',       x:  0.00, z:  0.30 },
    { t: 'mart_daily',     x:  0.74, z:  0.02 }
  ],

  init: function () {
    var el = this.el;
    var lift = this.data.lift;

    // --- 立体物（tools/build_model.py が生成した glTF）
    var model = document.createElement('a-entity');
    model.setAttribute('gltf-model', '#dag');
    el.appendChild(model);

    // --- ノード名。マーカーは机に平置きなので、文字も面に寝かせて上から読ませる
    this.labels.forEach(function (n) {
      var label = document.createElement('a-text');
      label.setAttribute('value', n.t);
      label.setAttribute('align', 'center');
      label.setAttribute('color', '#ffffff');
      label.setAttribute('width', 1.5);
      label.setAttribute('position', n.x + ' ' + (lift + 0.10) + ' ' + (n.z + 0.17));
      label.setAttribute('rotation', '-90 0 0');
      el.appendChild(label);
    });

    // --- 遅延が効いている mart_daily を光らせる。
    //     A-Frame の animation コンポーネントで拡縮を往復させている
    var pulse = document.createElement('a-box');
    pulse.setAttribute('position', '0.74 ' + lift + ' 0.02');
    pulse.setAttribute('width', 0.2);
    pulse.setAttribute('height', 0.2);
    pulse.setAttribute('depth', 0.2);
    pulse.setAttribute('material', 'color: #ff6a4d; opacity: 0.26; transparent: true');
    pulse.setAttribute('animation', {
      property: 'scale', from: '1 1 1', to: '1.45 1.45 1.45',
      dur: 900, dir: 'alternate', loop: true, easing: 'easeInOutSine'
    });
    el.appendChild(pulse);

    // --- 何が起きているかの一文
    var alertText = document.createElement('a-text');
    alertText.setAttribute('value',
      '07:02 ALERT  ad_clicks is 41 min late\nmart_daily will miss the 08:00 SLA');
    alertText.setAttribute('align', 'center');
    alertText.setAttribute('color', '#ff9d85');
    alertText.setAttribute('width', 2.2);
    alertText.setAttribute('position', '0 ' + (lift + 0.10) + ' -0.80');
    alertText.setAttribute('rotation', '-90 0 0');
    el.appendChild(alertText);

    // --- マーカーを見つけたら案内を引っ込める（preview には hint が無いので任意扱い）
    var hint = this.data.hint;
    if (hint) {
      el.addEventListener('markerFound', function () { hint.classList.add('found'); });
      el.addEventListener('markerLost', function () { hint.classList.remove('found'); });
    }
  }
});
