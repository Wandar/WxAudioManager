declare let wx: any;
/**
 * 微信小游戏平台的音频管理类
 * 
 */
class WxAudio {
  /** 单例 */
  private static _instance: WxAudio;
  constructor() {
    if (WxAudio._instance) throw `WxAudio cannot use new operator`;
    WxAudio._instance = this;
    let platform = wx.getSystemInfoSync().platform || '';
    // 安卓平台bug 实测微信6.6.7 版本库2.4.2，其他版本未测
    // 文档上并发音频数为10 实测只有5
    if (platform.toLowerCase() == 'android') WxAudio.WX_MAXAUDIO = 5;
    // 背景音乐
    this._bgm = wx.createInnerAudioContext();
    // 音效池数量 留一个给背景音乐
    let maxAudio = WxAudio.WX_MAXAUDIO - 1;
    for (let i = 0; i < maxAudio; i++) {
      this._createCtx();
    }

    // 背景音乐中断处理
    wx.onAudioInterruptionEnd(function () {
      WxAudio.instance.resumeBgm();
    })
  }
  /** 实例单例的get */
  static get instance() {
    if (!WxAudio._instance) {
      new WxAudio();
    }
    return WxAudio._instance;
  }
  /**
   * 并发播放音频数
   */
  static WX_MAXAUDIO = 10;
  /**
   * 音频池
   */
  private _ctxPool = [];
  /**
   * 正在播放的音频队列
   */
  private _playingCtx = [];
  /**
   * 背景音乐实例
   */
  private _bgm;
  /**
   * 播放音效
   * @param {string} src 音频src
   * */
  playEfc(src: string) {
    let ctx = this.getAudioCtx()
    if (ctx) {
      ctx.src = src;
      !ctx.paused && ctx.seek(0);
      // 调用play时实例的paused属性并不会马上改变，所以这里添加一个isplaying的属性，自己管理
      ctx.isplaying = true;
      ctx.play();
      this._removeFromPlaying(ctx);
      this._playingCtx.push(ctx);
    }
  }
  /** 
   * 播放背景音乐
   * @param {string} src 音频src
   * @param {boolean} loop 是否循环播放
   * @param {boolean} autoplay 是否循环播放
   * 
   */
  playBgm(src: string, loop = true, autoplay = true) {
    let bgm = this._bgm;
    bgm.loop = loop;
    bgm.src = src;
    bgm.autoplay = autoplay;
  }
  /** 
   * 暂停背景音乐
   * 
   */
  pauseBgm() {
    let bgm = this._bgm;
    if (!bgm.paused) bgm.pause();
  }
  /** 
   * 重新播放背景音乐
   * 
   */
  resumeBgm() {
    let bgm = this._bgm;
    if (!!bgm.src || bgm.src == '') {
      console.warn(`请先play背景音乐`);
      return
    }
    if (bgm.paused) bgm.play();
  }
  /**
   * 停止播放背景音乐
   * 
   */
  stopBgm() {
    this._bgm.stop();
  }
  /**
   * 背景音乐是否播放中
   */
  get bgmIsPlaying() {
    return !this._bgm.paused;
  }
  /**
   * 创建音频实例
   * @private
   */
  private _createCtx() {
    let ctx = wx.createInnerAudioContext();
    ctx.onEnded(() => WxAudio.onEfcEnd(ctx));
    ctx.onStop(() => WxAudio.onEfcEnd(ctx));
    ctx.onPause(() => WxAudio.onEfcEnd(ctx));
    ctx.onError(err =>  WxAudio.onEfcErr(ctx, err));

    this._ctxPool.push(ctx);
  }
  /**
   * 音频播放完成处理函数
   * @param ctx 音频实例
   */
  static onEfcEnd(ctx) {
    WxAudio.instance._removeFromPlaying(ctx);
    ctx.isplaying = false;
  }
  /**
   * 音频播放错误处理，移除音频池，销毁，重新创建一个丢到音频池
   * @param ctx 音频实例
   * @param err 错误信息
   */
  static onEfcErr(ctx, err) {
    console.error(err)
    let ctrl = WxAudio.instance
    ctrl._removeFromPlaying(ctx);
    ctrl._removeFromPool(ctx);
    ctx.isplaying = false;
    ctx.destroy();

    if (ctrl._ctxPool.length < WxAudio.WX_MAXAUDIO - 1)
      ctrl._createCtx();
  }
  /**
   * 从播放队列中移除
   * @param ctx 音频实例
   */
  private _removeFromPlaying(ctx) {
    let playing = this._playingCtx;
    let i = playing.indexOf(ctx);
    if (i >= 0) {
      playing.splice(i, 1);
    }
  }
  /**
   * 从音频池中移除
   * @param ctx 音频实例
   */
  private _removeFromPool(ctx) {
    let pool = this._ctxPool;
    let i = pool.indexOf(ctx);
    if (i >= 0) {
      pool.splice(i, 1);
    }
  }
  /**
   * 从音频池中获取音频实例
   * 折中策略，优先播放新的音频
   * 如果音频池内音频都在播放状态，将从播放队列中停止最先开始播放的音频返回
   * 
   */
  getAudioCtx() {
    let pool = this._ctxPool;
    for (let i = 0, len = pool.length; i < len; i++) {
      let ctx = pool[i];
      if (!ctx.isplaying) {
        return ctx
      }
    }

    let c = this._playingCtx.shift();
    c.stop();
    return c;
  }

  stopAllEfc() {
    let pool = this._ctxPool;
    pool.map(ctx=> ctx.stop());
  }

}
