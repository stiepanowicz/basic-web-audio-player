{
    class AudioPlayer extends HTMLElement {
        playing = false;
        currentTime = 0;
        duration = 0;
        volume = 0.4;
        prevVolume = 0.4;
        initialized = false;
        title = 'untitled';
        
        constructor() {
            super();
    
            this.attachShadow({ mode: 'open' });
            this.render();
        }

        static get observedAttributes() {
           return ['src', 'title', 'muted', 'crossorigin', 'loop', 'preload']; 
        }

        async attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'src') {
                if (this.playing) {
                    await this.togglePlay();
                }

                this.initialized = false;
                this.render();
            } else if (name === 'title') {
                this.title = newValue;

                if (this.titleElement) {
                    this.titleElement.textContent = this.title;
                }
            } else if (name === 'muted') {
                this.volumeBar.value = 0;
                this.volume = 0;
            }
            
            for (let i = 0; i < this.attributes.length; i++) {
                const attr = this.attributes[i];

                if (attr.specified && attr.name !== 'title') {
                    this.audio.setAttribute(attr.name, attr.value);
                }
            }


            if (!this.initialized) {
                this.initializeAudio();
            }

            console.log('--- ', name, oldValue, newValue);
        }

        initializeAudio() { 
            if (this.initialized) return;

            this.initialized = true;
            this.volumeBar.value = 0.4;

            this.audioContext = new AudioContext();


            this.track  = this.audioContext.createMediaElementSource(this.audio);
            this.gainNode = this.audioContext.createGain();
            this.analyzerNode = this.audioContext.createAnalyser();
            
            this.analyzerNode.fftSize = 2048;
            this.bufferLength = this.analyzerNode.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.analyzerNode.getByteFrequencyData(this.dataArray);

            this.track
                .connect(this.gainNode)
                .connect(this.analyzerNode)
                .connect(this.audioContext.destination);

            this.changeVolume();
            this.attachEvents();
        }

        updateFrequency() {
            if (!this.playing) return;

            this.analyzerNode.getByteFrequencyData(this.dataArray);

            this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvasContext.fillStyle = 'rgba(0, 0, 0, 0)';
            this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const barWidth = 3;
            const gap = 2;
            const barCount = this.bufferLength / ((barWidth + gap) - gap);
            let x = 0;

            for (let i = 0; i < barCount; i++) {
                const perc = (this.dataArray[i] * 100) / 255;
                const h = (perc * this.canvas.height) / 100;

                this.canvasContext.fillStyle = `rgba(${this.dataArray[i]}, 100, 255, 1)`;
                this.canvasContext.fillRect(x, this.canvas.height - h, barWidth, h);

                x += barWidth + gap;
            }


            console.log('-- updateFrequency');

            requestAnimationFrame(this.updateFrequency.bind(this));
        }

        attachEvents() {
            this.playPauseBtn.addEventListener( 'click', this.togglePlay.bind(this), false);
            this.volumeBar.addEventListener('input', this.changeVolume.bind(this));
            this.volumeBar.parentNode.addEventListener('click', (e) => {
                if (e.target === this.volumeBar.parentNode) {
                    this.toggleMute();
                }
            });
            this.progressBar.addEventListener('input', () => {
                this.seekTo(this.progressBar.value);
            }, false);

            this.audio.addEventListener('loadedmetadata', () => {
                this.duration = this.audio.duration;
                this.progressBar.max = this.duration;

                const secs = `${parseInt(`${this.duration % 60}`, 10)}`.padStart(2, '0');
                const mins = parseInt(`${this.duration/60 % 60 }`, 10);

                this.durationEl.textContent = `${mins}:${secs}`;

                // console.log('duration', this.audio.duration); 
                // console.log('currentTime', this.audio.currentTime);
            })

            this.audio.addEventListener('timeupdate', () => {
                this.updateAudioTime(this.audio.currentTime);
            })
            
            this.audio.addEventListener('ended', () => {
                this.playing = false;
                this.playPauseBtn.textContent = 'play';
            })
        }

        async togglePlay() {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            if (this.playing) {
                this.audio.pause();
                this.playing = false;
                this.playPauseBtn.textContent = 'play';
                this.playPauseBtn.classList.remove('playing');
            } else {
                await this.audio.play();
                this.playing = true;
                this.playPauseBtn.textContent = 'pause';
                this.playPauseBtn.classList.add('playing');
            }
            this.updateFrequency();
        }
        
        seekTo(value) {
            this.audio.currentTime = value;
        }

        updateAudioTime(time) {
            this.currentTime = time;
            this.progressBar.value = this.currentTime;

            const secs = `${parseInt(`${time % 60}`, 10)}`.padStart(2, '0');
            const mins = parseInt(`${time/60 % 60 }`, 10);

            this.currentTimeEl.textContent = `${mins}:${secs}`;
        }

        changeVolume() {
            this.prevVolume = this.volume;
            this.volume = Number(this.volumeBar.value);

            if (Number(this.volume) > 1) {
                this.volumeBar.parentNode.className = 'volume-bar over';
            } else if (Number(this.volume) > 0) {
                this.volumeBar.parentNode.className = 'volume-bar half';
            } else {
                this.volumeBar.parentNode.className = 'volume-bar';
            }
            this.gainNode.gain.value = this.volume;
        }

        toggleMute() {
            this.volumeBar.value = this.volume === 0 
            ? this.prevVolume 
            : 0
            this.changeVolume();
        }

        style() {
            return `
            <style>
            :host {
                width: 100%;
                max-width: 400px;
                font-family: sans-serif;
            }
            
            :host * {
                box-sizing: border-box;
            }
            
            .audio-player {
                background: #111;
                border-radius: 5px;
                color: #fff;
                padding: 5px;
                display: flex;
                align-items: center;
                position: relative;
                margin: 0 0 25px;
            }
            
            .audio-name {
                position: absolute;
                top: calc(100% + 2px);
                background: inherit;
                width: 100%;
                left: 0;
                padding: 5px 10px;
                font-size: 12px;
                text-transform: capitalize;
                margin: 0;
                border-radius: 3px;
            } 
            
            .play-btn,
            .volume-bar {
                width: 30px;
                min-width: 30px;
                height: 30px;
            }
            
            .play-btn {
                background: url(audio-player-icon-sprite.png) 0 center/500% 100% no-repeat;
                appearance: none;
                border: none;
                text-indent: -9999999px;
                overflow: hidden;
            }

            .play-btn.playing {
                background: url(audio-player-icon-sprite.png) 25% center/500% 100% no-repeat;
            }
            
            .volume-bar {
                background: url(audio-player-icon-sprite.png) 50% center/500% 100% no-repeat;
                position: relative;
            }

            .volume-bar.half {
                background: url(audio-player-icon-sprite.png) 75% center/500% 100% no-repeat;
            }

            .volume-bar.over {
                background: url(audio-player-icon-sprite.png) 100% center/500% 100% no-repeat;
            }
            
            .volume-field {
                display: none;
                position: absolute;
                right: 100%;
                top: 50%;
                transform: translateY(-50%);
                z-index: 5;
                margin: 0;
                appearance: none;
                height: 20px;
                border-radius: 2px;
                background: #fff;
            }

            .volume-field::-webkit-slider-thumb {
                appearance: none;
                height: 20px;
                width: 10px;
                background: #6d78ff;
            }

            .volume-field::-moz-range-thumb {
                appearance: none;
                height: 20px;
                width: 10px;
                background: #6d78ff;
            }
            
            .volume-bar:hover .volume-field {
                display: block;
            }
            
            .progress-indicator {
                flex: 1;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                height: 20px;
                position: relative;
            }

            .duration,
            .current-time {
                position: relative;
                z-index: 1;
                text-shadow: 0 0 2px #ffffff
            }

            .duration {
                margin-left: 2px;
                margin-right: 5px;
            }

            .duration::before {
                content: '/';
                display: inline-block;
                margin-right: 2px;
            }

            .progress-bar {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                left: 0;
                z-index: 2;
                width: 100%;
                height: 100%;
                appearance: none; 
                background: none;
                overflow: hidden;
            }

            .progress-bar::-webkit-slider-thumb {
                appearance: none;
                height: 10px;
                width: 0;
                box-shadow: -300px 0 0 300px #ffffff38;
            }

            .progress-bar::-moz-range-thumb {
                appearance: none;
                height: 10px;
                width: 0;
                box-shadow: -300px 0 0 300px #ffffff38;
            }

            canvas {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                left: 0;
                opacity: 0.4;
            }
            
            </style>
            
            `;
        }

        render() {
            // hide default player with style="display: none" on audio
            this.shadowRoot.innerHTML = `
            ${this.style()}
            <figure class="audio-player">
                <figcaption class="audio-name">${this.title}</figcaption>
                <audio src="Sunology, Pt. 2.mp3" style="display: none"></audio>
                <button class="play-btn" type="button">play</button>
                <div class="progress-indicator">
                    <span class="current-time">0:00</span>
                    <input type="range" max="100" value="0" class="progress-bar">
                    <span class="duration">0:00</span>
                    <canvas style="width: 100%; height: 20px"></canvas>
                </div>
                <div class="volume-bar">
                    <input type="range" min="0" max="2" step="0.01" value="${this.volume}" class="volume-field">
                </div>
            </figure>

            `;

            this.audio = this.shadowRoot.querySelector('audio');
            this.canvas = this.shadowRoot.querySelector('canvas');
            this.playPauseBtn = this.shadowRoot.querySelector('.play-btn');
            this.titleElement = this.shadowRoot.querySelector('.audio-name')
            this.volumeBar = this.shadowRoot.querySelector('.volume-field');
            this.progressIndicator = this.shadowRoot.querySelector('.progress-indicator');
            this.currentTimeEl = this.progressIndicator.children[0];
            this.progressBar = this.progressIndicator.children[1];
            this.durationEl = this.progressIndicator.children[2];

            this.canvasContext = this.canvas.getContext('2d');
        }
    }
    
    customElements.define('audio-player', AudioPlayer);
}
