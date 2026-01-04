import { getEncoding } from "https://esm.sh/js-tiktoken@1.0.12";

const input = document.querySelector("#input");
const output = document.querySelector("#output");
const inputTokens = document.querySelector("#input-tokens");
const outputTokens = document.querySelector("#output-tokens");
const seedInput = document.querySelector("#seed");
const randomizeBtn = document.querySelector("#randomize");
const inputCount = document.querySelector("#input-count");
const modeInputs = document.querySelectorAll('input[name="mode"]');

let encoder;
let vocabSize = 100256;
function setCounts(inTokens = []) {
  inputCount.textContent = `${inTokens.length} tokens`;
}

function formatTokens(tokens = []) {
  return tokens.length ? tokens.join(", ") : "";
}

function javaStringHashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function parseSeedToShift(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  if (/^-?\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }
  return javaStringHashCode(trimmed);
}

function autoResizeTextarea(element) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function syncOutputHeight() {
  output.style.height = `${input.scrollHeight}px`;
}

function rotateTokens(tokens, k) {
  if (!tokens.length) {
    return [];
  }
  if (!vocabSize) {
    return tokens;
  }

  const offset = ((k % vocabSize) + vocabSize) % vocabSize;
  return tokens.map((token) => (token + offset) % vocabSize);
}

function inverseRotateTokens(tokens, k) {
  if (!tokens.length) {
    return [];
  }
  if (!vocabSize) {
    return tokens;
  }

  const offset = ((k % vocabSize) + vocabSize) % vocabSize;
  return tokens.map((token) => (token - offset + vocabSize) % vocabSize);
}

function getMode() {
  const selected = document.querySelector('input[name="mode"]:checked');
  return selected ? selected.value : "encrypt";
}

function setRandomSeed() {
  const value = Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, "0");
  seedInput.value = value;
}

function processCipher() {
  if (!encoder) {
    return;
  }

  const sourceText = input.value;
  if (!sourceText) {
    output.value = "";
    inputTokens.textContent = "";
    outputTokens.textContent = "";
    autoResizeTextarea(output);
    syncOutputHeight();
    setCounts([]);
    return;
  }

  const k = parseSeedToShift(seedInput.value);
  const direction = getMode();
  const originalTokens = encoder.encode(sourceText);
  const rotatedTokens =
    direction === "encrypt"
      ? rotateTokens(originalTokens, k)
      : inverseRotateTokens(originalTokens, k);
  const decoded = encoder.decode(rotatedTokens);

  output.value = decoded;
  autoResizeTextarea(output);
  syncOutputHeight();
  inputTokens.textContent = formatTokens(originalTokens);
  outputTokens.textContent = formatTokens(rotatedTokens);
  setCounts(originalTokens);
}

function initTokenizer() {
  try {
    encoder = getEncoding("cl100k_base");
    setRandomSeed();
    processCipher();
  } catch (error) {
    console.error(error);
  }
}

input.addEventListener("input", (event) => {
  autoResizeTextarea(event.target);
  syncOutputHeight();
  processCipher();
});

seedInput.addEventListener("input", () => processCipher());

randomizeBtn.addEventListener("click", () => {
  setRandomSeed();
  processCipher();
  randomizeBtn.classList.add("spin");
  randomizeBtn.disabled = true;
  window.setTimeout(() => {
    randomizeBtn.classList.remove("spin");
    randomizeBtn.disabled = false;
  }, 200);
});

modeInputs.forEach((inputEl) => {
  inputEl.addEventListener("change", () => processCipher());
});

initTokenizer();
autoResizeTextarea(input);
syncOutputHeight();
