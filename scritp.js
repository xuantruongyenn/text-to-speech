const textInput = document.getElementById('text-input');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const apiKeyInput = document.getElementById('api-key');
const languageSelect = document.getElementById('language');
const voiceSelect = document.getElementById('voice');
const progressBarFill = document.getElementById('progress-bar-fill');
const audioPlayer = document.getElementById('audio-player');
const downloadButton = document.getElementById('download-button');
const textOption = document.getElementById('text-option');
const fileOption = document.getElementById('file-option');
const textInputSection = document.getElementById('text-input-section');
const fileInputSection = document.getElementById('file-input-section');

const googleTTSBaseUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize?key=';

fileInput.addEventListener('change', handleFileUpload);
languageSelect.addEventListener('change', updateVoices);
textOption.addEventListener('change', toggleInputOption);
fileOption.addEventListener('change', toggleInputOption);

function toggleInputOption() {
    if (textOption.checked) {
        textInputSection.style.display = 'flex';
        fileInputSection.style.display = 'none';
        textInput.value = '';
        fileInput.value = '';
        fileInfo.textContent = '';
    } else {
        textInputSection.style.display = 'none';
        fileInputSection.style.display = 'flex';
        textInput.value = '';
        fileInput.value = '';
        fileInfo.textContent = '';
    }
}

function handleFileUpload() {
    const file = fileInput.files[0];
    if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = function(e) {
            textInput.value = e.target.result;
            updateFileInfo();
        }
        reader.readAsText(file);
    } else {
        alert('Please upload a valid .txt file');
    }
}

function updateFileInfo() {
    const text = textInput.value;
    const fileSize = new Blob([text]).size;
    fileInfo.textContent = `File size: ${fileSize} bytes | Number of characters: ${text.length}`;
    estimateConversionCost(text.length);
}

function estimateConversionCost(charCount) {
    const costPerCharacter = 0.000004; // Example cost, adjust according to actual pricing
    const cost = charCount * costPerCharacter;
    fileInfo.textContent += ` | Estimated conversion cost: $${cost.toFixed(4)}`;
}

function updateVoices() {
    // Fetch and populate voices based on selected language
    const voices = {
        'en-US': ['en-US-Wavenet-A', 'en-US-Wavenet-B'],
        'es-ES': ['es-ES-Wavenet-A', 'es-ES-Wavenet-B'],
        'fr-FR': ['fr-FR-Wavenet-A', 'fr-FR-Wavenet-B'],
        'vi-VN': ['vi-VN-Wavenet-A', 'vi-VN-Wavenet-B']
    };
    voiceSelect.innerHTML = '';
    (voices[languageSelect.value] || []).forEach(voice => {
        const option = document.createElement('option');
        option.value = voice;
        option.textContent = voice;
        voiceSelect.appendChild(option);
    });
}

async function convertTextToSpeech() {
    const apiKey = apiKeyInput.value;
    const text = textInput.value;
    const language = languageSelect.value;
    const voice = voiceSelect.value;

    if (!apiKey || !text || !language || !voice) {
        alert('Please fill in all fields');
        return;
    }

    const requestBody = {
        input: { text: text },
        voice: { languageCode: language, name: voice },
        audioConfig: { audioEncoding: 'MP3' }
    };

    progressBarFill.style.width = '25%';
    progressBarFill.textContent = '25%';

    const response = await fetch(`${googleTTSBaseUrl}${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    progressBarFill.style.width = '50%';
    progressBarFill.textContent = '50%';

    if (response.ok) {
        const data = await response.json();
        const audioContent = data.audioContent;
        const audioBlob = b64toBlob(audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);

        audioPlayer.src = audioUrl;
        audioPlayer.style.display = 'block';
        downloadButton.style.display = 'block';

        downloadButton.onclick = () => {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = 'speech.mp3';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        progressBarFill.style.width = '100%';
        progressBarFill.textContent = '100%';
    } else {
        alert('Error converting text to speech');
        progressBarFill.style.width = '0%';
        progressBarFill.textContent = '0%';
    }
}

function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

textInput.addEventListener('input', updateFileInfo);
