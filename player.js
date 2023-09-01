{
    class AudioPlayer extends HTMLElement {
        playing = false;
        currentTime = 0;
        duration = 0;
        volume = 0.4;
        
        constructor() {
            super();
    
            this.attachShadow({ mode: 'open' });
            this.render();
            this.initializeAudio();
            this.attachEvents();
        }

        initializeAudio() {
            this.audioContext = new AudioContext();

            this.track  = this.audioContext.createMediaElementSource(this.audio);
            this.gainNode = this.audioContext.createGain();
            this.analyzerNode = this.audioContext.createAnalyser();
            
            this.analyzerNode.fftSize = 2048;
            this.bufferLength = this.analyzerNode.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.analyzerNode.getByteFrequencyData(this.dataArray);

            this.analyzerNode
            this.track
                .connect(this.gainNode)
                .connect(this.audioContext.destination);

        }

        updateFrequency() {
            if (!this.playing) return;

            this.analyzerNode.getByteFrequencyData(this.dataArray);

            this.canvasContext.fillStyle = 'rgb(255, 0, 0)';
            this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);


            console.log('-- updateFrequency');

            requestAnimationFrame(this.updateFrequency.bind(this));
        }

        attachEvents() {
            this.playPauseBtn.addEventListener( 'click', this.togglePlay.bind(this), false);

            this.volumeBar.addEventListener('input', this.changeVolume.bind(this));

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
            } else {
                await this.audio.play();
                this.playing = true;
                this.playPauseBtn.textContent = 'pause';
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
            this.volume = this.volumeBar.value;
            this.gainNode.gain.value = this.volume;
        }

        render() {
            // hide default player with style="display: none" on audio
            this.shadowRoot.innerHTML = `

            <audio src="Sunology, Pt. 2.mp3"></audio>
            <button class="play-btn" type="button">play</button>
            <canvas style="width: 100%; height: 20px"></canvas>
            <div class="progress-indicator">
                <span class="current-time">0:00</span>
                <input type="range" max="100" value="0" class="progress-bar">
                <span class="duration">0:00</span>
            </div>
            <div class="volume-bar">
                <input type="range" min="0" max="2 " step="0.01" value="${this.volume}" class="volume-slider">
            </div>
            `;

            this.audio = this.shadowRoot.querySelector('audio');
            this.canvas = this.shadowRoot.querySelector('canvas');
            this.playPauseBtn = this.shadowRoot.querySelector('.play-btn');
            this.volumeBar = this.shadowRoot.querySelector('.volume-slider');
            this.progressIndicator = this.shadowRoot.querySelector('.progress-indicator');
            this.currentTimeEl = this.progressIndicator.children[0];
            this.progressBar = this.progressIndicator.children[1];
            this.durationEl = this.progressIndicator.children[2];

            this.canvasContext = this.canvas.getContext('2d');
        }
    }
    
    customElements.define('audio-player', AudioPlayer);
}
