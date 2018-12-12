# 微信小游戏平台的音频管理类

## 适用
- 微信小游戏平台
- 游戏逻辑不强依赖音频播放

## 复用策略
- 音频池处理，初始化时默认创建10个[InnerAudioContext](https://developers.weixin.qq.com/minigame/dev/api/InnerAudioContext.html)实例,~~安卓5个（实测安卓微信6.6.7 版本库2.4.2，并发数为5，文档上为10~~ （锤子手机短音效播放完成偶发不会触发onEnd和onStop，paused转态也不会更新，有待解决）。
- 当音频池中所有音频都处于播放状态，有新的音频需要播放，折中处理，停止播放队列中最先开始播放的音频，优先播放新的音频。

## 背景音乐和音效
- 大部分小游戏音频分为一个loop的背景音乐和很多短的音效，所以缓存一个实例作为背景音乐单独管理，其他放在音频池集中管理。
- 音效只管理其播放，不控制其暂停。

## 使用
大部分引擎提供ts支持，用的最多也是ts，所以ts实现。
多平台可以在业务封装一层，判断平台来使用不同的音频管理类。
``` ts
  const audioMg = WxAudio.instance;
  // 播放音效
  audioMg.playEfc('topath/click.mp3');
  // 停止所有音效
  audioMg.stopAllEfc()

  // 播放背景音乐，循环播放，自动播放
  audioMg.playBgm(src);
  // 播放背景音乐，单次播放，自动播放
  audioMg.playBgm(src, false);
  // 播放背景音乐，单次播放，不自动播放
  audioMg.playBgm(src，false，false);

  // 暂停背景音乐
  audioMg.pauseBgm();
  // 重新播放背景音乐, 也可用于播放设置不自动播放的背景音乐
  audioMg.resumeBgm();
  // 停止播放背景音乐
  audioMg.stopBgm();

```
