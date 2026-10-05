const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const WebSocket = require('ws');

const testDir = path.join(__dirname, 'temp/voice_check');
fs.ensureDirSync(testDir);

/**
 * Native Windows PowerShell SAPI5 Voice Check
 */
function testPowerShellVoices() {
  const script = `
Add-Type -AssemblyName System.Speech;
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$voices = $synth.GetInstalledVoices();
foreach ($v in $voices) {
    Write-Output ($v.VoiceInfo.Name + " | " + $v.VoiceInfo.Gender + " | " + $v.VoiceInfo.Culture);
}
  `;
  try {
    const out = execSync(`powershell -Command "${script.replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
    console.log('Installed Windows Voices:\n', out);
  } catch (e) {
    console.error('PowerShell voice list error:', e.message);
  }
}

testPowerShellVoices();
