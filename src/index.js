// eslint-disable-next-line require-jsdoc
import Uploader from './uploader';
import buttonIcon from './svg/button-icon.svg';
require('./index.css').toString();

// eslint-disable-next-line require-jsdoc
export default class SimpleCarousel {
  /**
   * @param {CarousellData} data - previously saved data
   * @param {CarouselConfig} config - user config for Tool
   * @param {object} api - Editor.js API
   */
  constructor({ data, config, api }) {
    this.api = api;
    this.data = data;
    this.IconClose = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M8 8L12 12M12 12L16 16M12 12L16 8M12 12L8 16"></path></svg>';
    this.IconLeft = '<svg class="icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M351,9a15,15 0 01 19,0l29,29a15,15 0 01 0,19l-199,199l199,199a15,15 0 01 0,19l-29,29a15,15 0 01-19,0l-236-235a16,16 0 01 0-24z" /></svg>';
    this.IconRight = '<svg class="icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M312,256l-199-199a15,15 0 01 0-19l29-29a15,15 0 01 19,0l236,235a16,16 0 01 0,24l-236,235a15,15 0 01-19,0l-29-29a15,15 0 01 0-19z" /></svg>';
    this.config = {
      endpoints: config.endpoints || '',
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      field: config.field || 'image',
      types: config.types || 'image/*',
      captionPlaceholder: this.api.i18n.t('Caption'),
      buttonContent: config.buttonContent || '',
      uploader: config.uploader || undefined
    };
    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error)
    });
  }

  /**
   * CSS classes
   * @constructor
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: 'cdxcarousel-wrapper',
      addButton: 'cdxcarousel-addImage',
      block: 'cdxcarousel-block',
      item: 'cdxcarousel-item',
      removeBtn: 'cdxcarousel-removeBtn',
      leftBtn: 'cdxcarousel-leftBtn',
      rightBtn: 'cdxcarousel-rightBtn',
      inputUrl: 'cdxcarousel-inputUrl',
      caption: 'cdxcarousel-caption',
      list: 'cdxcarousel-list',
      imagePreloader: 'image-tool__image-preloader'
    };
  };

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      title: 'Carousel',
      icon: '<svg width="38" height="18" viewBox="0 0 38 18" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="10" y="0" width="18" height="18"><path fill-rule="evenodd" clip-rule="evenodd" d="M28 16V2C28 0.9 27.1 0 26 0H12C10.9 0 10 0.9 10 2V16C10 17.1 10.9 18 12 18H26C27.1 18 28 17.1 28 16V16ZM15.5 10.5L18 13.51L21.5 9L26 15H12L15.5 10.5V10.5Z"  /></mask><g mask="url(#mask0)"><rect x="10" width="18" height="18"  /></g><mask id="mask1" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="3" width="7" height="12"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 13.59L2.67341 9L7 4.41L5.66802 3L0 9L5.66802 15L7 13.59Z" fill="white"/></mask><g mask="url(#mask1)"><rect y="3" width="7.55735" height="12"  /></g><mask id="mask2" mask-type="alpha" maskUnits="userSpaceOnUse" x="31" y="3" width="7" height="12"><path fill-rule="evenodd" clip-rule="evenodd" d="M31 13.59L35.3266 9L31 4.41L32.332 3L38 9L32.332 15L31 13.59Z" fill="white"/></mask><g mask="url(#mask2)"><rect x="30.4426" y="2.25" width="7.55735" height="13" /></g></svg>'
    };
  }

  /**
   * Renders Block content
   * @public
   *
   * @return {HTMLDivElement}
   */
  render() {
    /*
     * Structure
     * <wrapper>
     *  <list>
     *    <item/>
     *    ...
     *  </list>
     *  <addButton>
     * </wrapper>
     */
    // Создаем базу для начала
    this.wrapper = make('div', [ this.CSS.wrapper ]);
    this.list = make('div', [ this.CSS.list ]);
    this.addButton = this.createAddButton();

    this.list.appendChild(this.addButton);
    this.wrapper.appendChild(this.list);
    if (this.data.length > 0) {
      for (const load of this.data) {
        const loadItem = this.createNewItem(load);

        this.list.insertBefore(loadItem, this.addButton);
      }
    }
    return this.wrapper;
  }

  // eslint-disable-next-line require-jsdoc
  save(blockContent) {
    const list = blockContent.getElementsByClassName(this.CSS.item);
    const data = [];

    if (list.length > 0) {
      for (const item of list) {
        if (item.firstChild.value && ('file' in item.dataset)) {
          let file = JSON.parse(item.dataset.file);
          file.caption = item.lastChild.value;
          data.push(file);
        }
      }
    }
    return data;
  }

  /**
   * Create Image block
   * @public
   *
   * @param {object} data Fields: url - url of saved or upload image, caption - caption of image, any custom props
   *
   * Structure
   * <item>
   *  <url/>
   *  <removeButton/>
   *  <img/>
   *  <caption>
   * </item>
   *
   * @return {HTMLDivElement}
   */
  createNewItem(data) {
    // Create item, remove button and field for image url
    const block = make('div', [ this.CSS.block ]);
    const item = make('div', [ this.CSS.item ]);
    const removeBtn = make('div', [ this.CSS.removeBtn ]);
    const leftBtn = make('div', [ this.CSS.leftBtn ]);
    const rightBtn = make('div', [ this.CSS.rightBtn ]);
    const imageUrl = make('input', [ this.CSS.inputUrl ]);
    const imagePreloader = make('div', [ this.CSS.imagePreloader ]);

    imageUrl.value = data.url || '';
    leftBtn.innerHTML = this.IconLeft;
    leftBtn.style = 'padding: 8px;';
    leftBtn.addEventListener('click', () => {
      const index = Array.from(block.parentNode.children).indexOf(block);

      if(index != 0) {
        block.parentNode.insertBefore(block, block.parentNode.children[index-1]);
      }
    });
    rightBtn.innerHTML = this.IconRight;
    rightBtn.style = 'padding: 8px;';
    rightBtn.addEventListener('click', () => {
      const index = Array.from(block.parentNode.children).indexOf(block);

      if(index != block.parentNode.children.length-2) {
        block.parentNode.insertBefore(block, block.parentNode.children[index+2]);
      }
    });
    removeBtn.innerHTML = this.IconClose;
    removeBtn.addEventListener('click', () => {
      block.remove();
    });
    removeBtn.style.display = 'none';

    item.appendChild(imageUrl);
    item.appendChild(removeBtn);
    item.appendChild(leftBtn);
    item.appendChild(rightBtn);
    block.appendChild(item);
    /*
     * If data already yet
     * We create Image view
     */
    if (data.url || '') {
      this._createImage(data.url || '', item, data.caption || '', removeBtn);
    } else {
      item.appendChild(imagePreloader);
    }
    item.dataset.file = JSON.stringify(data);
    return block;
  }

  /**
   * Create Image View
   * @public
   *
   * @param {string} url - url of saved or upload image
   * @param {HTMLDivElement} item - block of created image
   * @param {string} captionText - caption of image
   * @param {HTMLDivElement} removeBtn - button for remove image block
   *
   * @return {HTMLDivElement}
   */
  _createImage(url, item, captionText, removeBtn) {
    const image = document.createElement('img');
    const caption = make('input', [this.CSS.caption, this.CSS.input]);

    image.src = url;
    if (captionText) {
      caption.value = captionText;
    }
    caption.placeholder = this.config.captionPlaceholder;

    removeBtn.style.display = 'flex';

    item.appendChild(image);
    item.appendChild(caption);
  }

  /**
   * File uploading callback
   * @private
   *
   * @param {Response} response
   */
  onUpload(response) {
    if (response.success && response.file) {
      // Берем последний созданный элемент и ставим изображение с сервера
      const item = this.list.childNodes[this.list.childNodes.length - 2].firstChild;
      item.dataset.file = JSON.stringify(response.file);
      this._createImage(response.file.url, item, '', item.childNodes[1]);
      item.childNodes[2].style.backgroundImage = '';
      item.firstChild.value = response.file.url;
      item.classList.add('cdxcarousel-item--empty');
    } else {
      this.uploadingFailed('incorrect response: ' + JSON.stringify(response));
    }
  }

  /**
   * Handle uploader errors
   * @private
   *
   * @param {string} errorText
   */
  uploadingFailed(errorText) {
    console.warn('Gallery : uploading failed because of', errorText);

    this.api.notifier.show({
      message: this.api.i18n.t('Can not upload an image, try another'),
      style: 'error'
    });
  }

  /**
   * Shows uploading preloader
   * @param {string} src - preview source
   */
  showPreloader(src) {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;
  }

  // eslint-disable-next-line require-jsdoc
  onSelectFile() {
    // Создаем элемент
    this.uploader.uploadSelectedFile({
      onPreview: (src) => {
        const newItem = this.createNewItem({});

        newItem.firstChild.lastChild.style.backgroundImage = `url(${src})`;
        this.list.insertBefore(newItem, this.addButton);
      }
    });
  }

  /**
   * Create add button
   * @private
   */
  createAddButton() {
    const addButton = make('div', [this.CSS.button, this.CSS.addButton]);
    const block = make('div', [ this.CSS.block ]);

    addButton.innerHTML = buttonIcon + ' ' + this.api.i18n.t('Add Image');
    addButton.addEventListener('click', () => {
      this.onSelectFile();
    });
    block.appendChild(addButton);

    return block;
  }
}

/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {array|string} classNames  - list or name of CSS class
 * @param  {Object} attributes        - any attributes
 * @return {Element}
 */
export const make = function make(tagName, classNames = null, attributes = {}) {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    el[attrName] = attributes[attrName];
  }

  return el;
};
