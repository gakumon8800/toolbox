(function () {
  'use strict';

  var STORAGE_KEYS = {
    favorites: 'naiken-gacha-favorites',
    history: 'naiken-gacha-history'
  };

  var MAX_HISTORY = 30;
  var MAX_UNIQUE_ATTEMPTS = 60;
  var fixedOption = { value: '', label: '固定しない' };

  var appearanceOptions = {
    hairStyle: ['short hair', 'bob cut', 'medium-length hair', 'long hair', 'ponytail', 'half-up hairstyle'],
    hairColor: ['black hair', 'dark brown hair', 'soft brown hair'],
    vibe: ['clean and refined look', 'natural and approachable look', 'calm and composed atmosphere', 'slightly cute and soft impression', 'urban and polished mood'],
    bodyType: ['slim build', 'average build', 'slightly delicate frame'],
    outfit: [
      'clean casual outfit',
      'simple everyday outfit',
      'knit top and skirt',
      'shirt and tailored pants',
      'modest one-piece dress',
      'light jacket with neat outing wear'
    ]
  };

  var toneOptions = [
    {
      value: 'natural',
      label: 'ナチュラル',
      style: 'soft daylight, neutral tones, practical apartment viewing mood',
      consistency: 'grounded lifestyle feel, realistic apartment details, gentle everyday atmosphere'
    },
    {
      value: 'luxury',
      label: '高級感',
      style: 'elegant lighting, premium materials, upscale rental ambiance, refined textures',
      consistency: 'tasteful composition, restrained sophistication, clean premium interior details'
    },
    {
      value: 'single-life',
      label: '一人暮らし感',
      style: 'compact urban apartment mood, relatable lifestyle realism, lived-in but tidy feeling',
      consistency: 'practical room scale, first-apartment vibe, believable solo-living atmosphere'
    },
    {
      value: 'cute-room',
      label: 'かわいい部屋感',
      style: 'bright and airy mood, warm accents, cozy and charming room styling',
      consistency: 'soft inviting interior tone, clean cute details, natural lifestyle presentation'
    },
    {
      value: 'simple-modern',
      label: 'シンプルモダン',
      style: 'minimal modern interior, clean lines, balanced daylight, uncluttered composition',
      consistency: 'simple geometry, calm modern finish, clear and functional apartment styling'
    }
  ];

  var scenes = [
    { value: 'entrance', label: '玄関', english: 'apartment entrance area', environment: 'compact entryway, shoe cabinet, clean floor, natural indoor light', actions: ['open-door', 'look-room', 'walk-lightly', 'turn-back', 'look-smartphone'], shots: ['front', 'diagonal-front', 'from-side', 'medium', 'half-body'] },
    { value: 'living-room', label: 'リビング', english: 'living room of a rental apartment', environment: 'bright living area, simple floor plan, uncluttered interior, daylight from the window', actions: ['look-room', 'walk-lightly', 'turn-back', 'sit-sofa', 'touch-fixture', 'think-lightly', 'look-smartphone'], shots: ['front', 'diagonal-front', 'from-side', 'wide', 'medium', 'full-body', 'half-body'] },
    { value: 'kitchen', label: 'キッチン', english: 'apartment kitchen', environment: 'compact clean kitchen, practical storage, realistic appliances, bright neutral lighting', actions: ['look-kitchen', 'open-storage', 'touch-fixture', 'look-smartphone', 'think-lightly'], shots: ['diagonal-front', 'from-side', 'medium', 'half-body'] },
    { value: 'bathroom', label: 'バスルーム', english: 'rental apartment bathroom', environment: 'clean bathroom unit, realistic fixtures, bright reflective surfaces, tidy space', actions: ['look-room', 'touch-fixture', 'think-lightly'], shots: ['diagonal-front', 'from-side', 'medium', 'half-body'] },
    { value: 'toilet', label: 'トイレ', english: 'apartment toilet room', environment: 'small clean toilet room, simple white walls, practical layout, neutral light', actions: ['look-room', 'touch-fixture', 'think-lightly'], shots: ['diagonal-front', 'from-side', 'medium', 'half-body'] },
    { value: 'washroom', label: '洗面所', english: 'apartment washroom', environment: 'clean vanity area, mirror and sink, compact utility space, bright light', actions: ['look-room', 'touch-fixture', 'look-smartphone'], shots: ['front', 'diagonal-front', 'from-side', 'medium', 'half-body'] },
    { value: 'storage', label: '収納', english: 'storage space in the apartment', environment: 'closet or storage area, practical shelving, clean walls, realistic apartment interior', actions: ['open-storage', 'look-room', 'think-lightly'], shots: ['front', 'diagonal-front', 'from-side', 'medium', 'half-body'] },
    { value: 'window-side', label: '窓際', english: 'window side inside the apartment', environment: 'daylight near a large window, curtain rail, bright room edge, airy interior feeling', actions: ['look-outside', 'look-room', 'turn-back', 'walk-lightly'], shots: ['front', 'diagonal-front', 'from-side', 'from-back', 'wide', 'full-body', 'half-body'] },
    { value: 'balcony', label: 'ベランダ', english: 'apartment balcony', environment: 'small rental balcony, outdoor railing, city view, natural daylight, realistic exterior atmosphere', actions: ['look-outside', 'step-to-balcony', 'turn-back', 'walk-lightly'], shots: ['diagonal-front', 'from-side', 'from-back', 'wide', 'full-body', 'half-body'] },
    { value: 'hallway', label: '廊下', english: 'apartment hallway', environment: 'narrow clean hallway, indoor doors, realistic apartment layout, balanced indoor light', actions: ['walk-lightly', 'turn-back', 'look-room', 'look-smartphone'], shots: ['front', 'diagonal-front', 'from-side', 'from-back', 'wide', 'full-body'] },
    { value: 'outside-front', label: '外観前', english: 'in front of the apartment building', environment: 'apartment building exterior, entrance approach, realistic urban neighborhood, daylight', actions: ['look-room', 'walk-lightly', 'turn-back', 'look-smartphone', 'think-lightly'], shots: ['front', 'diagonal-front', 'from-side', 'wide', 'full-body', 'half-body'] },
    { value: 'shared-space', label: '共用部', english: 'shared corridor or common area', environment: 'shared apartment space, corridor or elevator hall, clean common facilities, realistic building details', actions: ['walk-lightly', 'turn-back', 'look-smartphone', 'look-room'], shots: ['front', 'diagonal-front', 'from-side', 'from-back', 'wide', 'full-body', 'half-body'] },
    { value: 'building-entrance', label: 'エントランス', english: 'building entrance lobby', environment: 'apartment entrance lobby, mailboxes or auto-lock area, polished but realistic common entrance', actions: ['walk-lightly', 'look-room', 'look-smartphone', 'think-lightly'], shots: ['front', 'diagonal-front', 'from-side', 'wide', 'full-body', 'half-body'] },
    { value: 'door-front', label: '室内ドア前', english: 'in front of an interior door inside the apartment', environment: 'indoor doorway, simple wall finish, realistic apartment circulation, natural interior light', actions: ['open-door', 'turn-back', 'look-room', 'walk-lightly'], shots: ['front', 'diagonal-front', 'from-side', 'from-back', 'medium', 'full-body', 'half-body'] }
  ];

  var actions = [
    { value: 'open-door', label: 'ドアを開ける', phrase: 'opening the door gently during an apartment viewing' },
    { value: 'look-room', label: '部屋を見る', phrase: 'looking around the room carefully during an apartment viewing' },
    { value: 'look-outside', label: '窓の外を見る', phrase: 'looking outside through the window with natural curiosity' },
    { value: 'walk-lightly', label: '少し歩く', phrase: 'walking a few steps naturally while checking the apartment layout' },
    { value: 'turn-back', label: '振り返る', phrase: 'turning back slightly after checking the room' },
    { value: 'open-storage', label: '収納を開ける', phrase: 'opening the storage space to check capacity' },
    { value: 'look-kitchen', label: 'キッチンを見る', phrase: 'checking the kitchen area and worktop calmly' },
    { value: 'look-smartphone', label: 'スマホを見る', phrase: 'glancing at her smartphone as if checking notes or room details' },
    { value: 'think-lightly', label: '少し悩む', phrase: 'pausing for a moment with a thoughtful and natural expression' },
    { value: 'sit-sofa', label: 'ソファに座る', phrase: 'sitting on the sofa briefly to imagine daily life in the room' },
    { value: 'touch-fixture', label: '設備に軽く触れる', phrase: 'lightly touching a fixture to check its condition' },
    { value: 'step-to-balcony', label: 'ベランダに出ようとする', phrase: 'about to step onto the balcony while checking the view and openness' }
  ];

  var shots = [
    { value: 'front', label: '正面', phrase: 'front view' },
    { value: 'diagonal-front', label: '斜め前', phrase: 'three-quarter front view' },
    { value: 'from-side', label: '横から', phrase: 'side view' },
    { value: 'from-back', label: '後ろから', phrase: 'back view' },
    { value: 'wide', label: 'やや引き', phrase: 'slightly wide composition showing room context' },
    { value: 'medium', label: '中距離', phrase: 'medium-distance framing' },
    { value: 'full-body', label: '全身', phrase: 'full-body framing' },
    { value: 'half-body', label: '半身', phrase: 'half-body framing' }
  ];

  var negativePrompt = [
    'nsfw', 'lingerie', 'bikini', 'cleavage', 'fetish', 'seductive pose', 'exaggerated emotion',
    'fantasy scene', 'celebrity lookalike', 'specific person', 'idol style', 'school uniform',
    'maid outfit', 'cosplay', 'overacting', 'dramatic cinematic action', 'multiple people', 'crowd',
    'text', 'watermark', 'logo', 'low resolution', 'blurry', 'deformed hands', 'extra fingers',
    'bad anatomy', 'distorted face', 'unnatural body', 'duplicate person'
  ].join(', ');

  var dom = {
    tone: document.getElementById('tone'),
    hairStyle: document.getElementById('hairStyle'),
    outfit: document.getElementById('outfit'),
    scene: document.getElementById('scene'),
    action: document.getElementById('action'),
    shot: document.getElementById('shot'),
    results: document.getElementById('results'),
    resultsMeta: document.getElementById('resultsMeta'),
    copyAllButton: document.getElementById('copyAllButton'),
    favorites: document.getElementById('favorites'),
    favoritesEmpty: document.getElementById('favoritesEmpty'),
    history: document.getElementById('history'),
    historyEmpty: document.getElementById('historyEmpty'),
    clearFavoritesButton: document.getElementById('clearFavoritesButton'),
    clearHistoryButton: document.getElementById('clearHistoryButton'),
    template: document.getElementById('promptCardTemplate')
  };

  var state = {
    currentResults: [],
    favorites: loadList(STORAGE_KEYS.favorites),
    history: loadList(STORAGE_KEYS.history)
  };

  function loadList(key) {
    try {
      var raw = window.localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function saveList(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function uniqueId() {
    return 'prompt-' + Date.now() + '-' + Math.random().toString(16).slice(2, 10);
  }

  function getSceneByValue(value) {
    return scenes.find(function (item) {
      return item.value === value;
    }) || null;
  }

  function getActionByValue(value) {
    return actions.find(function (item) {
      return item.value === value;
    }) || null;
  }

  function getShotByValue(value) {
    return shots.find(function (item) {
      return item.value === value;
    }) || null;
  }

  function getToneByValue(value) {
    return toneOptions.find(function (item) {
      return item.value === value;
    }) || toneOptions[0];
  }

  function fillSelect(select, options, formatLabel) {
    var items = [fixedOption].concat(options.map(function (option) {
      return {
        value: option.value || option,
        label: formatLabel ? formatLabel(option) : (option.label || option)
      };
    }));

    select.innerHTML = items.map(function (option) {
      return '<option value="' + option.value + '">' + option.label + '</option>';
    }).join('');
  }

  function fillToneSelect() {
    dom.tone.innerHTML = toneOptions.map(function (option) {
      return '<option value="' + option.value + '">' + option.label + '</option>';
    }).join('');
  }

  function fillActionOptions() {
    var sceneConfig = getSceneByValue(dom.scene.value);
    var options = sceneConfig
      ? actions.filter(function (action) {
        return sceneConfig.actions.indexOf(action.value) >= 0;
      })
      : actions;

    fillSelect(dom.action, options);
  }

  function fillShotOptions() {
    var sceneConfig = getSceneByValue(dom.scene.value);
    var shotPool = sceneConfig ? sceneConfig.shots.slice() : shots.map(function (shot) { return shot.value; });
    var actionConfig = getActionByValue(dom.action.value);

    if (actionConfig) {
      if (actionConfig.value === 'look-outside' || actionConfig.value === 'step-to-balcony') {
        shotPool = shotPool.filter(function (shot) {
          return ['diagonal-front', 'from-side', 'from-back', 'wide', 'full-body', 'half-body'].indexOf(shot) >= 0;
        });
      }

      if (actionConfig.value === 'open-storage' || actionConfig.value === 'touch-fixture' || actionConfig.value === 'look-kitchen') {
        shotPool = shotPool.filter(function (shot) {
          return ['front', 'diagonal-front', 'from-side', 'medium', 'half-body'].indexOf(shot) >= 0;
        });
      }
    }

    if (!shotPool.length && sceneConfig) {
      shotPool = sceneConfig.shots.slice();
    }

    fillSelect(dom.shot, shots.filter(function (shot) {
      return shotPool.indexOf(shot.value) >= 0;
    }));
  }

  function initializeFilters() {
    fillToneSelect();
    fillSelect(dom.hairStyle, appearanceOptions.hairStyle);
    fillSelect(dom.outfit, appearanceOptions.outfit);
    fillSelect(dom.scene, scenes);
    fillActionOptions();
    fillShotOptions();
  }

  function collectFilters() {
    return {
      tone: dom.tone.value || toneOptions[0].value,
      hairStyle: dom.hairStyle.value,
      outfit: dom.outfit.value,
      scene: dom.scene.value,
      action: dom.action.value,
      shot: dom.shot.value
    };
  }

  function buildPrompt(data) {
    return [
      '### Prompt (' + data.theme + ')',
      'ultra photorealistic scene of a young Japanese woman in her early 20s viewing a rental apartment, ' + data.appearanceLine + ', ' + data.action.phrase + ', ' + data.scene.environment + ', ' + data.shot.phrase + ', realistic one-scene storytelling, natural body language, simple and usable for short-form social media content',
      '',
      '### Appearance:',
      data.appearanceLine + ', natural makeup, no celebrity resemblance, realistic facial features',
      '',
      '### Outfit:',
      data.outfit + ', modest styling, practical for apartment viewing, no revealing clothing',
      '',
      '### Pose:',
      data.action.phrase + ', relaxed shoulders, natural posture, understated emotion',
      '',
      '### Scene:',
      data.scene.english + ', ' + data.scene.environment,
      '',
      '### Style:',
      data.tone.style + ', realistic rental property photography, soft natural light, stable photorealism',
      '',
      '### Consistency:',
      'same person within the scene, stable identity, coherent body proportions, ' + data.tone.consistency + ', single scene only, one action only, natural apartment viewing context',
      '',
      '### Negative Prompt:',
      negativePrompt
    ].join('\n');
  }

  function generateOne(filters) {
    var scene = filters.scene ? getSceneByValue(filters.scene) : randomItem(scenes);
    var actionPool = scene.actions.slice();
    var action = filters.action && actionPool.indexOf(filters.action) >= 0
      ? getActionByValue(filters.action)
      : getActionByValue(randomItem(actionPool));

    var shotPool = scene.shots.slice();
    if (action.value === 'look-outside' || action.value === 'step-to-balcony') {
      shotPool = shotPool.filter(function (shot) {
        return ['diagonal-front', 'from-side', 'from-back', 'wide', 'full-body', 'half-body'].indexOf(shot) >= 0;
      });
    }
    if (action.value === 'open-storage' || action.value === 'touch-fixture' || action.value === 'look-kitchen') {
      shotPool = shotPool.filter(function (shot) {
        return ['front', 'diagonal-front', 'from-side', 'medium', 'half-body'].indexOf(shot) >= 0;
      });
    }
    if (!shotPool.length) {
      shotPool = scene.shots.slice();
    }

    var shot = filters.shot && shotPool.indexOf(filters.shot) >= 0
      ? getShotByValue(filters.shot)
      : getShotByValue(randomItem(shotPool));

    var tone = getToneByValue(filters.tone);
    var hairStyle = filters.hairStyle || randomItem(appearanceOptions.hairStyle);
    var outfit = filters.outfit || randomItem(appearanceOptions.outfit);
    var appearanceLine = [
      hairStyle,
      randomItem(appearanceOptions.hairColor),
      randomItem(appearanceOptions.vibe),
      randomItem(appearanceOptions.bodyType)
    ].join(', ');
    var theme = tone.label + ' / ' + scene.label + ' / ' + action.label;

    return {
      id: uniqueId(),
      theme: theme,
      toneLabel: tone.label,
      sceneLabel: scene.label,
      actionLabel: action.label,
      shotLabel: shot.label,
      appearanceLine: appearanceLine,
      outfit: outfit,
      tone: tone,
      scene: scene,
      action: action,
      shot: shot,
      text: buildPrompt({
        theme: theme,
        appearanceLine: appearanceLine,
        outfit: outfit,
        tone: tone,
        scene: scene,
        action: action,
        shot: shot
      })
    };
  }

  function generateBatch(count) {
    var filters = collectFilters();
    var results = [];
    var seen = {};
    var attempts = 0;

    while (results.length < count && attempts < MAX_UNIQUE_ATTEMPTS) {
      attempts += 1;
      var item = generateOne(filters);
      var signature = [item.theme, item.appearanceLine, item.outfit, item.shotLabel].join('|');

      if (seen[signature]) {
        continue;
      }

      seen[signature] = true;
      results.push(item);
    }

    state.currentResults = results;
    state.history = results.concat(state.history).slice(0, MAX_HISTORY);
    saveList(STORAGE_KEYS.history, state.history);
    renderResults();
    renderHistory();
  }

  function findPromptById(itemId) {
    return state.currentResults.concat(state.favorites, state.history).find(function (item) {
      return item.id === itemId;
    }) || null;
  }

  function isFavorite(itemId) {
    return state.favorites.some(function (item) {
      return item.id === itemId;
    });
  }

  function toggleFavorite(itemId) {
    var sourceItem = findPromptById(itemId);
    if (!sourceItem) {
      return;
    }

    if (isFavorite(itemId)) {
      state.favorites = state.favorites.filter(function (item) {
        return item.id !== itemId;
      });
    } else {
      state.favorites.unshift(sourceItem);
    }

    saveList(STORAGE_KEYS.favorites, state.favorites);
    renderResults();
    renderFavorites();
  }

  function removeHistoryItem(itemId) {
    state.history = state.history.filter(function (item) {
      return item.id !== itemId;
    });
    saveList(STORAGE_KEYS.history, state.history);
    renderHistory();
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error('Clipboard unavailable'));
  }

  function buildCard(item, removeMode) {
    var template = dom.template.content.cloneNode(true);
    var eyebrow = template.querySelector('.card-eyebrow');
    var title = template.querySelector('h3');
    var promptText = template.querySelector('.prompt-text');
    var copyButton = template.querySelector('.copy-button');
    var favoriteButton = template.querySelector('.favorite-button');
    var removeButton = template.querySelector('.remove-button');

    eyebrow.textContent = item.sceneLabel + ' / ' + item.actionLabel + ' / ' + item.shotLabel;
    title.textContent = item.theme;
    promptText.textContent = item.text;

    copyButton.addEventListener('click', function () {
      copyText(item.text).then(function () {
        copyButton.textContent = 'コピー済み';
        window.setTimeout(function () {
          copyButton.textContent = 'コピー';
        }, 1200);
      }).catch(function () {
        window.alert('コピーに失敗しました。');
      });
    });

    favoriteButton.textContent = isFavorite(item.id) ? 'お気に入り済み' : 'お気に入り';
    if (isFavorite(item.id)) {
      favoriteButton.classList.add('is-active');
    }
    favoriteButton.addEventListener('click', function () {
      toggleFavorite(item.id);
    });

    if (removeMode === 'history') {
      removeButton.addEventListener('click', function () {
        removeHistoryItem(item.id);
      });
    } else if (removeMode === 'favorite') {
      removeButton.addEventListener('click', function () {
        toggleFavorite(item.id);
      });
    } else {
      removeButton.style.display = 'none';
    }

    return template;
  }

  function renderResults() {
    dom.results.innerHTML = '';
    dom.resultsMeta.textContent = state.currentResults.length
      ? state.currentResults.length + '件生成しました。必要なものをコピーまたはお気に入り保存できます。'
      : 'まだ生成されていません。';

    state.currentResults.forEach(function (item) {
      dom.results.appendChild(buildCard(item, ''));
    });
  }

  function renderFavorites() {
    dom.favorites.innerHTML = '';
    dom.favoritesEmpty.style.display = state.favorites.length ? 'none' : 'block';

    state.favorites.forEach(function (item) {
      dom.favorites.appendChild(buildCard(item, 'favorite'));
    });
  }

  function renderHistory() {
    dom.history.innerHTML = '';
    dom.historyEmpty.style.display = state.history.length ? 'none' : 'block';

    state.history.forEach(function (item) {
      dom.history.appendChild(buildCard(item, 'history'));
    });
  }

  function copyAllResults() {
    if (!state.currentResults.length) {
      window.alert('先にプロンプトを生成してください。');
      return;
    }

    var text = state.currentResults.map(function (item) {
      return item.text;
    }).join('\n\n--------------------\n\n');

    copyText(text).then(function () {
      dom.copyAllButton.textContent = '全件コピー済み';
      window.setTimeout(function () {
        dom.copyAllButton.textContent = '全件コピー';
      }, 1400);
    }).catch(function () {
      window.alert('全件コピーに失敗しました。');
    });
  }

  function bindEvents() {
    dom.scene.addEventListener('change', function () {
      fillActionOptions();
      fillShotOptions();
    });

    dom.action.addEventListener('change', fillShotOptions);

    Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (button) {
      button.addEventListener('click', function () {
        generateBatch(Number(button.getAttribute('data-count')));
      });
    });

    dom.copyAllButton.addEventListener('click', copyAllResults);

    dom.clearFavoritesButton.addEventListener('click', function () {
      state.favorites = [];
      saveList(STORAGE_KEYS.favorites, state.favorites);
      renderResults();
      renderFavorites();
    });

    dom.clearHistoryButton.addEventListener('click', function () {
      state.history = [];
      saveList(STORAGE_KEYS.history, state.history);
      renderHistory();
    });
  }

  function init() {
    initializeFilters();
    bindEvents();
    renderResults();
    renderFavorites();
    renderHistory();
  }

  init();
})();
