{
    class AudioPlayer extends HTMLElement {
        constructor() {
            super();
    
            this.playing = false;
            this.attachShadow({ mode: 'open' });
            this.render();
            this.initializeAudio();
            this.attachEvents();
        }

        initializeAudio() {
            this.audioContext = new AudioContext();

            this.track  = this.audioContext.createMediaElementSource(this.audio);

            this.track.connect(this.audioContext.destination);
        }

        attachEvents() {
            this.playPauseBtn.addEventListener( 'click', this.togglePlay.bind(this) )
        }

        async togglePlay() {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            if (this.playing) {
                await this.audio.pause();
                this.playing = false;
                this.playPauseBtn.textContent = 'play';
            } else {
                await this.audio.play();
                this.playing = true;
                this.playPauseBtn.textContent = "pause";
            }
        }

        render() {
            this.shadowRoot.innerHTML = `
            <audio src="Sunology, Pt. 2.mp3" controls></audio>
            <button class="play-btn" type="button">play</button>
            `;

            this.audio = this.shadowRoot.querySelector('audio');
            this.playPauseBtn = this.shadowRoot.querySelector('.play-btn');
        }
    }
    
    customElements.define('audio-player', AudioPlayer);
}