/* =========================================
   NTE DAMAGE CALCULATOR - MAIN LOGIC
========================================= */

let currentFormMode = 'simple';
let savedBuilds = [];

function getNumber(id){
  return Number(document.getElementById(id)?.value || 0);
}

// フォームの切り替え
function switchFormMode(mode){
  currentFormMode = mode;
  const simpleSection = document.getElementById('simpleFormSection');
  const detailSection = document.getElementById('detailFormSection');
  const simpleBtn = document.getElementById('showSimpleBtn');
  const detailBtn = document.getElementById('showDetailBtn');

  if(simpleSection) simpleSection.style.display = mode === 'simple' ? 'block' : 'none';
  if(detailSection) detailSection.style.display = mode === 'detail' ? 'block' : 'none';
  if(simpleBtn) simpleBtn.className = mode === 'simple' ? 'primary' : 'secondary';
  if(detailBtn) detailBtn.className = mode === 'detail' ? 'primary' : 'secondary';
}

// 弧盤プリセットが変更された時の処理
function onArcPresetChange() {
  const presetId = document.getElementById('arcPresetSelect').value;
  if (presetId === 'custom') return; // 手動入力なら何もしない

  const arc = window.NTE_DATA.arcs.find(a => a.id === presetId);
  if (!arc) return;

  const lv = Number(document.getElementById('arcLevel').value || 80);
  const凸 = Number(document.getElementById('arcTarget').value || 5);

  // レベル比例計算用 (Lv1〜Lv80を直線的に補間)
  const calcStat = (min, max) => {
    if (min === max) return min;
    const val = min + (max - min) * (lv - 1) / 79;
    return Math.round(val * 10) / 10;
  };

  const arcAtk = Math.round(calcStat(arc.baseAtkMin, arc.baseAtkMax));
  const subStatVal = calcStat(arc.subStatMin, arc.subStatMax);
  const eff1Val = arc.effect1Values[凸] || 0;
  const eff2Val = arc.effect2Values[凸] || 0;

  // フォームへ値を代入
  document.getElementById('arcAtk').value = arcAtk;
  
  // 一旦リセット
  document.getElementById('arcAtkPercent').value = 0;
  document.getElementById('arcCrit').value = 0;
  document.getElementById('arcCritDmg').value = 0;

  if (arc.subStatType === 'critRate') document.getElementById('arcCrit').value = subStatVal;
  if (arc.subStatType === 'critDmg') document.getElementById('arcCritDmg').value = subStatVal;
  if (arc.subStatType === 'atkPercent') document.getElementById('arcAtkPercent').value = subStatVal;

  document.getElementById('arcEffectAtk').value = 0;
  document.getElementById('arcDamage').value = 0;
  document.getElementById('arcEffectCritDmg').value = 0;
  document.getElementById('specialDamage').value = 0;

  const setEffectValue = (type, val) => {
    if (type === 'atkPercent') document.getElementById('arcEffectAtk').value = val;
    if (type === 'damage' || type === 'element') document.getElementById('arcDamage').value = val;
    if (type === 'critDmg') document.getElementById('arcEffectCritDmg').value = val;
    if (type === 'specialDamage') document.getElementById('specialDamage').value = val;
  };

  setEffectValue(arc.effect1Type, eff1Val);
  setEffectValue(arc.effect2Type, eff2Val);
}

// バフプリセットが変更された時の表示制御
function updateBuffRowUI(selectEl) {
  const row = selectEl.closest('.buff-row');
  const presetId = selectEl.value;
  const preset = window.NTE_DATA.presets.find(p => p.id === presetId);
  
  const nameInput = row.querySelector('.buff-name');
  const attackerWrap = row.querySelector('.buff-attacker-atk-wrap');
  const lvWrap = row.querySelector('.buff-skill-lv-wrap');
  const customFields = row.querySelectorAll('.buff-custom-field');

  if (!preset || presetId === 'custom') {
    if (attackerWrap) attackerWrap.style.display = 'none';
    if (lvWrap) lvWrap.style.display = 'none';
    customFields.forEach(f => f.style.display = 'flex');
  } else {
    if (nameInput) nameInput.value = preset.name;
    if (preset.type === 'attacker_base_ratio') {
      if (attackerWrap) attackerWrap.style.display = 'flex';
      if (lvWrap) lvWrap.style.display = preset.hasLv ? 'flex' : 'none';
    } else {
      if (attackerWrap) attackerWrap.style.display = 'none';
      if (lvWrap) lvWrap.style.display = 'none';
    }
    customFields.forEach(f => f.style.display = 'none');
  }
}

// バフのデータを取得・計算処理にマッピング
function getBuffs(){
  const buffs = [];
  let mainCharBaseAtk = 0;
  if(currentFormMode === 'simple'){
    mainCharBaseAtk = getNumber('simpleAtk');
  } else {
    mainCharBaseAtk = getNumber('charAtk') + getNumber('arcAtk');
  }

  document.querySelectorAll('.buff-row').forEach(row => {
    const presetId = row.querySelector('.buff-preset')?.value || 'custom';
    const name = row.querySelector('.buff-name')?.value || '';
    const attackerAtk = Number(row.querySelector('.buff-attacker-atk')?.value || 0);
    const skillLv = row.querySelector('.buff-skill-lv')?.value || '10';

    let baseAtk = 0;
    let skillAtk = 0;
    let atkPercent = 0;
    let critDmg = 0;

    if(presetId === 'custom'){
      baseAtk = Number(row.querySelector('.buff-base-atk')?.value || 0);
      skillAtk = Number(row.querySelector('.buff-ratio')?.value || 0);
      atkPercent = Number(row.querySelector('.buff-atk-percent')?.value || 0);
      critDmg = Number(row.querySelector('.buff-crit-dmg')?.value || 0);
    } else {
      const preset = window.NTE_DATA.presets.find(p => p.id === presetId);
      if(preset){
        if(preset.type === 'attacker_base_ratio'){
          let ratio = preset.ratio || 0;
          if(preset.hasLv) ratio = preset.ratios[skillLv] || 0;
          baseAtk = attackerAtk;
          skillAtk = ratio;
        } else if(preset.type === 'main_char_base_ratio'){
          baseAtk = mainCharBaseAtk;
          skillAtk = preset.ratio || 0;
        }
      }
    }

    buffs.push({
      name, baseAtk, skillAtk, atkPercent, critDmg, presetId, attackerAtk, skillLv
    });
  });

  return buffs;
}

// メインダメージ計算
function calculateDamage(){
  let buildName = '未命名';
  let finalAtk = 0;
  let critRate = 0;
  let critDamage = 0;
  let additiveDamage = 0;
  let atkPercent = 0;
  let skillMultiplier = 1;
  let defenseMultiplier = 1;
  let enemyDefRate = 0.8;
  let defIgnoreRate = 0;

  const currentBuffs = getBuffs();

  if(currentFormMode === 'simple'){
    buildName = document.getElementById('simpleBuildName')?.value.trim();
    if(!buildName){ alert('入力名を設定してください'); return; }

    const characterAtk = getNumber('simpleAtk');
    const gearFlatAtk = getNumber('simpleGearFlatAtk');

    atkPercent = (
      getNumber('simpleArcAtkPercent') +
      getNumber('simpleGearAtkPercent') +
      currentBuffs.reduce((sum,b)=>sum+b.atkPercent, 0)
    ) / 100;

    critRate = Math.min(100,
      getNumber('simpleCritRate') + getNumber('simpleArcCritRate') + getNumber('simpleGearCritRate')
    );

    critDamage = (
      getNumber('simpleCritDamage') + getNumber('simpleArcCritDamage') + getNumber('simpleGearCritDamage') +
      currentBuffs.reduce((sum,b)=>sum+b.critDmg, 0)
    ) / 100;

    additiveDamage = (
      getNumber('simpleGeneralDamage') + getNumber('simpleElementDamage') +
      getNumber('simpleArcDamage') + getNumber('simpleArcElement') +
      getNumber('simpleGearDamage') + getNumber('simpleGearElement')
    ) / 100;

    skillMultiplier = getNumber('simpleSkillMultiplier') / 100;
    enemyDefRate = getNumber('simpleEnemyDefRate');
    defIgnoreRate = getNumber('simpleDefIgnore') / 100;

    defenseMultiplier = 1 / (1 + (enemyDefRate * (1 - defIgnoreRate)));
    const flatBuffAtk = currentBuffs.reduce((sum,b)=> sum + (b.baseAtk * (b.skillAtk / 100)), 0);
    finalAtk = (characterAtk * (1 + atkPercent)) + gearFlatAtk + flatBuffAtk;
  }
  else {
    buildName = document.getElementById('buildName')?.value.trim();
    if(!buildName){ alert('入力名を設定してください'); return; }

    const charAtk = getNumber('charAtk');
    const arcAtk = getNumber('arcAtk');
    const baseAtk = charAtk + arcAtk;

    atkPercent = (
      getNumber('arcAtkPercent') + getNumber('arcEffectAtk') +
      getNumber('gearAtkPercent') + getNumber('gearStatAtkPercent') +
      currentBuffs.reduce((sum,b)=>sum+b.atkPercent, 0)
    ) / 100;

    const flatGearAtk = getNumber('gearFlatAtk');
    const flatSkillAtk = currentBuffs.reduce((sum,b)=> sum + (b.baseAtk * (b.skillAtk / 100)), 0);
    finalAtk = (baseAtk * (1 + atkPercent)) + flatGearAtk + flatSkillAtk;

    additiveDamage = (
      getNumber('gearGeneralDamage') + getNumber('gearElementDamage') +
      getNumber('arcDamage') + getNumber('specialDamage')
    ) / 100;

    critRate = Math.min(100,
      getNumber('charCrit') + getNumber('arcCrit') + getNumber('gearCrit') + getNumber('gearStatCrit')
    );

    critDamage = (
      getNumber('charCritDmg') + getNumber('arcCritDmg') + getNumber('arcEffectCritDmg') +
      getNumber('gearCritDmg') + getNumber('gearStatCritDmg') +
      currentBuffs.reduce((sum,b)=>sum+b.critDmg, 0)
    ) / 100;

    skillMultiplier = getNumber('skillMultiplier') / 100;
    enemyDefRate = getNumber('enemyDefRate');
    defIgnoreRate = getNumber('defIgnore') / 100;
    defenseMultiplier = 1 / (1 + (enemyDefRate * (1 - defIgnoreRate)));
  }

  const additiveDamageDisplay = (additiveDamage * 100).toFixed(1);
  const critDamageDisplay = (critDamage * 100).toFixed(1);

  const damageMultiplier = 1 + additiveDamage;
  const expectedCritMultiplier = 1 + ((critRate / 100) * critDamage);
  const nonCritDamage = finalAtk * skillMultiplier * damageMultiplier * defenseMultiplier;
  const critDamageValue = nonCritDamage * (1 + critDamage);
  const expectedDamage = nonCritDamage * expectedCritMultiplier;

  const defIgnoreExpected = finalAtk * skillMultiplier * damageMultiplier * (1 / (1 + (enemyDefRate * (1 - (defIgnoreRate + 0.01))))) * expectedCritMultiplier;
  const defIgnoreGain = defIgnoreExpected - expectedDamage;

  document.getElementById('resultContent').innerHTML = `
    <p><b>最終攻撃力:</b> ${Math.round(finalAtk).toLocaleString()}</p><hr>
    <p><b>防御補正:</b> ${defenseMultiplier.toFixed(4)}</p>
    <p style="font-size:12px;color:#64748b">1 / (1 + (${enemyDefRate.toFixed(2)} × (1 - ${(defIgnoreRate * 100).toFixed(1)}%)))</p><hr>
    <p><b>非クリダメージ:</b> ${Math.round(nonCritDamage).toLocaleString()}</p>
    <p style="font-size:12px;color:#64748b">${Math.round(finalAtk).toLocaleString()} × ${skillMultiplier.toFixed(2)} × (1 + ${additiveDamageDisplay}%) × ${defenseMultiplier.toFixed(4)}</p><hr>
    <p><b>クリティカルダメージ:</b> ${Math.round(critDamageValue).toLocaleString()}</p><hr>
    <p><b>期待値ダメージ:</b> ${Math.round(expectedDamage).toLocaleString()}</p><hr>
    <p><b>防御無視 +1% の期待値上昇量</b><br>+${Math.round(defIgnoreGain).toLocaleString()}</p>
  `;

  const buildData = {
    mode: currentFormMode,
    buildName, finalAtk, critRate, critDamage, additiveDamage, skillMultiplier, defenseMultiplier, enemyDefRate, defIgnoreRate, nonCritDamage, critDamageValue, expectedDamage,
    formData: collectCurrentFormData(),
    buffs: currentBuffs
  };

  const existingIndex = savedBuilds.findIndex(b => b.buildName === buildName);
  if(existingIndex >= 0){ savedBuilds[existingIndex] = buildData; }
  else{ savedBuilds.push(buildData); }

  renderBuildTable();
  localStorage.setItem('nte_saved_builds', JSON.stringify(savedBuilds));
}

function collectCurrentFormData(){
  const data = {};
  document.querySelectorAll('input, select').forEach(el => {
    if(el.id){ data[el.id] = el.value; }
  });
  return data;
}

function loadBuild(name){
  const build = savedBuilds.find(b => b.buildName === name);
  if(!build) return;

  switchFormMode(build.mode);

  Object.entries(build.formData).forEach(([id,value]) => {
    const el = document.getElementById(id);
    if(el){ el.value = value; }
  });

  const wrap = document.getElementById('buffContainer');
  wrap.innerHTML = '';

  if(build.buffs?.length){
    build.buffs.forEach(buff => {
      addBuffCard();
      const rows = document.querySelectorAll('.buff-row');
      const row = rows[rows.length - 1];

      const presetSelect = row.querySelector('.buff-preset');
      if (presetSelect && buff.presetId) presetSelect.value = buff.presetId;

      const attackerInput = row.querySelector('.buff-attacker-atk');
      if (attackerInput && buff.attackerAtk) attackerInput.value = buff.attackerAtk;

      const skillLvSelect = row.querySelector('.buff-skill-lv');
      if (skillLvSelect && buff.skillLv) skillLvSelect.value = buff.skillLv;

      row.querySelector('.buff-name').value = buff.name || '';
      row.querySelector('.buff-base-atk').value = buff.baseAtk || 0;
      row.querySelector('.buff-ratio').value = buff.skillAtk || 0;
      row.querySelector('.buff-atk-percent').value = buff.atkPercent || 0;
      row.querySelector('.buff-crit-dmg').value = buff.critDmg || 0;

      if (presetSelect) updateBuffRowUI(presetSelect);
    });
  } else {
    addBuffCard();
  }
  calculateDamage();
}

function renderBuildTable(){
  const tbody = document.getElementById('compareTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  if(savedBuilds.length === 0) return;

  savedBuilds.sort((a,b)=> b.expectedDamage - a.expectedDamage);
  const topDamage = savedBuilds[0].expectedDamage;

  savedBuilds.forEach((b,index)=>{
    const ratio = (b.expectedDamage / topDamage) * 100;
    const tr = document.createElement('tr');
    if(index === 0){ tr.classList.add('rank1'); }

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${b.buildName}</td>
      <td>${Math.round(b.finalAtk).toLocaleString()}</td>
      <td>${b.critRate.toFixed(1)}%</td>
      <td>${(b.critDamage*100).toFixed(1)}%</td>
      <td>${Math.round(b.nonCritDamage).toLocaleString()}</td>
      <td>${Math.round(b.critDamageValue).toLocaleString()}</td>
      <td>${Math.round(b.expectedDamage).toLocaleString()}</td>
      <td>${ratio.toFixed(1)}%</td>
      <td><div class="progress-wrap"><div class="progress-bar" style="width:${ratio}%"></div></div></td>
      <td>
        <button class="secondary" onclick="loadBuild('${b.buildName}')">読込</button>
        <button class="danger" onclick="deleteBuild('${b.buildName}')">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteBuild(name){
  savedBuilds = savedBuilds.filter(b => b.buildName !== name);
  renderBuildTable();
  localStorage.setItem('nte_saved_builds', JSON.stringify(savedBuilds));
}

// バフ追加ボタンが押された時の処理
function addBuffCard(){
  const wrap = document.getElementById('buffContainer');
  if(!wrap) return;

  const div = document.createElement('div');
  div.className = 'buff-row card';
  div.style.marginTop = '10px';

  let presetOptions = '';
  window.NTE_DATA.presets.forEach(p => {
    presetOptions += `<option value="${p.id}">${p.name}</option>`;
  });

  div.innerHTML = `
    <div class="buff-inline" style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
      <label style="min-width:140px">プリセット選択
        <select class="buff-preset" onchange="updateBuffRowUI(this)">
          ${presetOptions}
        </select>
      </label>
      <label style="min-width:140px" class="buff-name-wrap">バフ名
        <input type="text" class="buff-name" placeholder="例：ハニアULT">
      </label>
      <label class="buff-attacker-atk-wrap" style="display:none; min-width:120px;">発動キャラ基礎攻撃力
        <input type="number" class="buff-attacker-atk" value="0">
      </label>
      <label class="buff-skill-lv-wrap" style="display:none; min-width:90px;">スキルLv
        <select class="buff-skill-lv">
          <option value="1">Lv1</option><option value="2">Lv2</option><option value="3">Lv3</option>
          <option value="4">Lv4</option><option value="5">Lv5</option><option value="6">Lv6</option>
          <option value="7">Lv7</option><option value="8">Lv8</option><option value="9">Lv9</option>
          <option value="10" selected>Lv10</option>
        </select>
      </label>
      <label class="buff-custom-field buff-base-atk-wrap">基礎攻撃力
        <input type="number" class="buff-base-atk" value="0">
      </label>
      <label class="buff-custom-field buff-ratio-wrap">攻撃力ボーナス%
        <input type="number" class="buff-ratio" value="0">
      </label>
      <label class="buff-custom-field buff-atk-percent-wrap">攻撃力%
        <input type="number" class="buff-atk-percent" value="0">
      </label>
      <label class="buff-custom-field buff-crit-dmg-wrap">クリダメ%
        <input type="number" class="buff-crit-dmg" value="0">
      </label>
      <button class="danger" type="button" onclick="this.closest('.buff-row').remove();" style="height:38px">削除</button>
    </div>
  `;
  wrap.appendChild(div);
}

// 初期起動時の処理
window.addEventListener('DOMContentLoaded', () => {
  // 弧盤選択欄のリストをdata.jsから自動生成
  const select = document.getElementById('arcPresetSelect');
  if (select) {
    window.NTE_DATA.arcs.forEach(arc => {
      const opt = document.createElement('option');
      opt.value = arc.id;
      opt.textContent = arc.name;
      select.appendChild(opt);
    });
  }

  switchFormMode('simple');
  if(document.querySelectorAll('.buff-row').length === 0){ addBuffCard(); }

  const autoSave = localStorage.getItem('nte_saved_builds');
  if(autoSave){ try{ savedBuilds = JSON.parse(autoSave); }catch(e){ console.error(e); } }
  renderBuildTable();
});

function exportCSV(){
  if(savedBuilds.length === 0){ alert('保存データがありません'); return; }
  const sorted = [...savedBuilds].sort((a,b)=> b.expectedDamage - a.expectedDamage);
  const topDamage = sorted[0].expectedDamage;
  const rows = [['順位','名前','最終攻撃力','クリ率','クリダメ率','非クリ','クリティカル','期待値','比率','比率グラフ','操作']];

  sorted.forEach((b,index)=>{
    const ratio = (b.expectedDamage / topDamage) * 100;
    const graph = '■'.repeat(Math.max(1, Math.round(ratio / 5)));
    rows.push([
      index + 1, b.buildName, Math.round(b.finalAtk), `${b.critRate.toFixed(1)}%`, `${(b.critDamage * 100).toFixed(1)}%`,
      Math.round(b.nonCritDamage), Math.round(b.critDamageValue), Math.round(b.expectedDamage), `${ratio.toFixed(1)}%`, graph, ''
    ]);
  });

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nte_damage_compare.csv'; a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(){
  if(savedBuilds.length === 0){ alert('保存データがありません'); return; }
  const data = { version: 1, exportDate: new Date().toISOString(), builds: savedBuilds };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nte_damage_backup.json'; a.click();
  URL.revokeObjectURL(url);
}

function importJSON(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const json = JSON.parse(e.target.result);
      if(!json.builds || !Array.isArray(json.builds)){ alert('不正なJSONです'); return; }
      savedBuilds = json.builds;
      renderBuildTable();
      if(savedBuilds.length > 0){ loadBuild(savedBuilds[0].buildName); }
      alert('JSONを読み込みました');
    }catch(error){ console.error(error); alert('JSON読込に失敗しました'); }
  };
  reader.readAsText(file);
}

function resetForm(){
  document.querySelectorAll('#simpleFormSection input').forEach(el => {
    if(el.type === 'number'){ el.value = el.id === 'simpleSkillMultiplier' ? 100 : 0; }else{ el.value = ''; }
  });
  document.querySelectorAll('#detailFormSection input').forEach(el => {
    if(el.type === 'number'){ el.value = el.id === 'skillMultiplier' ? 100 : 0; }else{ el.value = ''; }
  });

  document.getElementById('simpleEnemyDefRate').value = 0.8;
  document.getElementById('simpleDefIgnore').value = 0;
  document.getElementById('enemyDefRate').value = 0.8;
  document.getElementById('defIgnore').value = 0;
  
  if(document.getElementById('arcPresetSelect')) document.getElementById('arcPresetSelect').value = 'custom';
  if(document.getElementById('arcLevel')) document.getElementById('arcLevel').value = 80;
  if(document.getElementById('arcTarget')) document.getElementById('arcTarget').value = 5;

  const buffContainer = document.getElementById('buffContainer');
  buffContainer.innerHTML = '';
  addBuffCard();

  document.getElementById('resultContent').innerHTML = '未計算';
  document.getElementById('recommendContent').innerHTML = '';
}