// File: main.js
// GUI Assignment: Oneline Scabble
// This project was to use what we learned all semester to create a Oneline scrabble game using javascript, html, css and jQuery. 
// Its a similiar game to scrabble to works similiar just a more similiar verision since it is only one line instead of a whole board
// Scott Zalomis, Umass Lowell Computer Science, scott_zalomis@cs.uml.edu
// Copyright (c) 2025 by Scott. All rights reserved. May be freely copied or
// excerpted for educational purposes with credit to the author.
// updated by SZ on December 14, 2025 at 5:00PM  
const BOARD_SIZE = 15;
const RACK_SIZE = 7;

const boardRow = document.getElementById("boardRow");
const rack = document.getElementById("rack");
const scoreDisplay = document.getElementById("score");

const DOUBLE_WORD_POSITIONS = [2, 12];
const DOUBLE_LETTER_POSITIONS = [6, 8];

let totalScore = 0; // Cumulative score

function getAvailableLetters() {
  const available = [];
  for (let letter in ScrabbleTiles) {
    const count = ScrabbleTiles[letter]["number-remaining"];
    for (let i = 0; i < count; i++) available.push(letter);
  }
  return available;
}

function randomLetter() {
  const available = getAvailableLetters();
  if (available.length === 0) return "_";
  return available[Math.floor(Math.random() * available.length)];
}

function createTile(letter) {
  const tile = document.createElement("div");
  tile.className = "tile";
  tile.dataset.letter = letter;
  tile.title = `${letter} (${ScrabbleTiles[letter]?.value || 0} pts)`;

  if (ScrabbleTiles[letter]) {
    ScrabbleTiles[letter]["number-remaining"]--;
  }

  if (letter !== "_") {
    const imagePath = `graphics_data/Scrabble_Tiles/Scrabble_Tile_${letter}.jpg`;
    const img = new Image();
    img.onload = () => { tile.style.backgroundImage = `url("${imagePath}")`; };
    img.onerror = () => { tile.style.backgroundColor = "#333"; };
    img.src = imagePath;
  } else {
    tile.style.backgroundColor = "#333";
  }

  $(tile).draggable({
    containment: ".game-shell",
    stack: ".tile",
    revert: "invalid",
    start: () => tile.classList.add("dragging"),
    stop: () => tile.classList.remove("dragging")
  });

  return tile;
}

// Redraw the rack with new tiles, discarding old ones
function redrawRack() {
  const oldTiles = Array.from(rack.querySelectorAll(".tile"));
  oldTiles.forEach(tile => {
    const letter = tile.dataset.letter;
    if (ScrabbleTiles[letter]) {
      ScrabbleTiles[letter]["number-remaining"]++;
    }
  });

  // Clear rack
  rack.innerHTML = "";

  // Add new tiles
  for (let i = 0; i < RACK_SIZE; i++) {
    const tile = createTile(randomLetter());
    rack.appendChild(tile);
  }

  setupRackDroppable(); // Reapply droppable behavior
  updateScore();
}

// Shuffle array utility
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Create initial rack with new tiles
function createRack() {
  rack.innerHTML = "";
  for (let i = 0; i < RACK_SIZE; i++) {
    const tile = createTile(randomLetter());
    rack.appendChild(tile);
  }

  setupRackDroppable();
}

// Shuffle existing tiles in the rack
function shuffleRack() {
  const tiles = Array.from(rack.querySelectorAll(".tile"));
  shuffleArray(tiles);
  rack.innerHTML = "";
  tiles.forEach(tile => {
    rack.appendChild(tile);
    $(tile).css({ position: "relative", top: 0, left: 0, transform: "none" });
  });
  updateScore();
}

function setupRackDroppable() {
  $("#rack").droppable({
    accept: ".tile",
    tolerance: "intersect",
    drop: function (event, ui) {
      const tile = ui.draggable[0];

      // Append tile to rack
      this.appendChild(tile);

      // Reset CSS for rack tiles
      $(tile).css({
        position: "relative",
        top: 0,
        left: 0,
        width: "90px",   // same as initial tile size
        height: "90px",  // same as initial tile size
        transform: "none"
      });

      $(tile).draggable("option", "revert", false);
      updateScore();
    }
  });
}


// Create board
function createBoard() {
  boardRow.innerHTML = "";
  for (let i = 0; i < BOARD_SIZE; i++) {
    const slot = document.createElement("div");
    slot.className = "board-slot";

    if (DOUBLE_WORD_POSITIONS.includes(i)) {
      slot.style.border = "2px solid red";
      slot.style.borderRadius = "8px";
    }

    $(slot).droppable({
      accept: ".tile",
      tolerance: "intersect",
      drop: function (event, ui) {
        const tile = ui.draggable[0];
        if (this.children.length > 0) {
          $(ui.draggable).draggable("option", "revert", true);
          return;
        }

        const fromRack = rack.contains(tile);
        if (fromRack) {
          const slotIndex = Array.from(boardRow.children).indexOf(this);
          if (slotIndex > 0 && !boardRow.children[slotIndex - 1].firstChild) {
            $(ui.draggable).draggable("option", "revert", true);
            return;
          }
        }

        this.appendChild(tile);
        $(tile).css({ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "none" });
        $(tile).draggable("option", "revert", false);
        updateScore();
      }
    });

    boardRow.appendChild(slot);
  }
}

// Update score
function updateScore() {
  let score = 0;
  let doubleWordMultiplier = false;

  document.querySelectorAll(".board-slot").forEach((slot, index) => {
    if (slot.firstChild) {
      const letter = slot.firstChild.dataset.letter;
      let letterValue = ScrabbleTiles[letter]?.value || 0;
      if (DOUBLE_LETTER_POSITIONS.includes(index)) letterValue *= 2;
      score += letterValue;
      if (DOUBLE_WORD_POSITIONS.includes(index)) doubleWordMultiplier = true;
    }
  });

  if (doubleWordMultiplier) score *= 2;
  scoreDisplay.textContent = totalScore + score;
}

// Submit word
function submitWord() {
  const slots = document.querySelectorAll(".board-slot");
  let word = "";
  let wordPoints = 0;
  let doubleWord = false;

  slots.forEach((slot, index) => {
    if (slot.firstChild) {
      const letter = slot.firstChild.dataset.letter;
      word += letter;
      let letterValue = ScrabbleTiles[letter]?.value || 0;
      if (DOUBLE_LETTER_POSITIONS.includes(index)) letterValue *= 2;
      wordPoints += letterValue;
      if (DOUBLE_WORD_POSITIONS.includes(index)) doubleWord = true;
    }
  });

  if (!word) return;
  if (doubleWord) wordPoints *= 2;
  totalScore += wordPoints;

  let submittedArea = document.getElementById("submittedWords");
  if (!submittedArea) {
    submittedArea = document.createElement("div");
    submittedArea.id = "submittedWords";
    submittedArea.style.marginTop = "12px";
    document.querySelector(".game-shell").appendChild(submittedArea);
  }

  const div = document.createElement("div");
  div.textContent = `Submitted Word: ${word} | Word Points: ${wordPoints} | Total Score: ${totalScore}`;
  submittedArea.appendChild(div);

  // Clear board
  slots.forEach(slot => { if (slot.firstChild) slot.removeChild(slot.firstChild); });

  // Refill rack if needed
  const currentTiles = rack.querySelectorAll(".tile").length;
  const missing = RACK_SIZE - currentTiles;
  for (let i = 0; i < missing; i++) rack.appendChild(createTile(randomLetter()));

  updateScore();
}

// Event listeners
document.getElementById("shuffleBtn").addEventListener("click", shuffleRack);
document.getElementById("resetBtn").addEventListener("click", () => {
  for (let letter in ScrabbleTiles) ScrabbleTiles[letter]["number-remaining"] = ScrabbleTiles[letter]["original-distribution"];
  createBoard();
  createRack();
  totalScore = 0;
  updateScore();

  const submittedArea = document.getElementById("submittedWords");
  if (submittedArea) submittedArea.innerHTML = "";
});

document.getElementById("submitBtn").addEventListener("click", submitWord);
document.getElementById("redrawBtn").addEventListener("click", redrawRack);

// Initialize
createBoard();
createRack();
updateScore();
