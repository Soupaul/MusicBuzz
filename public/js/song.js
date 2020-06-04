let song = document.getElementById("song");

const playOrPauseButton = document.querySelector(".playOrPause-button");
const prevButton = document.querySelector(".prev-button");
const nextButton = document.querySelector(".next-button");
const progressBar = document.getElementById("slider");
let completed = document.getElementById("completed");
let timeElapsed = document.getElementById("timeElapsed");
let timeLeft = document.getElementById("timeLeft");

let isPlaying = false;

function play(){

    song.play();
    playOrPauseButton.classList.remove("fa-play-circle");
    playOrPauseButton.classList.add("fa-pause-circle");

}

function pause(){

    song.pause();
    playOrPauseButton.classList.remove("fa-pause-circle");
    playOrPauseButton.classList.add("fa-play-circle");

}

function seek(){

    let newValue = progressBar.value/progressBar.max;
    song.currentTime = song.duration * newValue;


}

progressBar.addEventListener("input",seek);

playOrPauseButton.addEventListener("click",function(){

    if(!isPlaying)
        play();
    else
        pause();

    isPlaying = !isPlaying;

});

song.addEventListener("ended",function(){

    playOrPauseButton.classList.remove("fa-pause-circle");
    playOrPauseButton.classList.add("fa-play-circle");
    isPlaying = false;

});

function showTimeElapsed(){

    let secs = Math.floor(song.currentTime % 60);
    let mins = Math.floor(song.currentTime / 60);

    var secsText = "" + secs;
    if(secs < 10) secsText = "0" + secs;   

    minsText = "0" + mins;

    timeElapsed.textContent = minsText + ":" + secsText;

}

function showTimeLeft(){

    let secs = Math.floor((song.duration - song.currentTime) % 60);
    let mins = Math.floor((song.duration - song.currentTime) / 60);


    var secsText = "" + secs;

    if(secs < 10) secsText = "0" + secs;   

    minsText = "0" + mins;

    timeLeft.textContent = minsText + ":" + secsText;

}

song.addEventListener("timeupdate",function(){

    let currentVal = Math.round(song.currentTime/song.duration * 100);
    progressBar.value = currentVal;

    completed.style.width = currentVal + "%";

    showTimeElapsed();

    showTimeLeft();

});

document.addEventListener("keydown",keyDownHandler);

function keyDownHandler(e){

    if(e.key === " "){

        if(isPlaying)
            pause();
        else
            play();

        isPlaying = !isPlaying;
    }

}

$(document).ready(function () {

    isPlaying = true;
    setTimeout(play, 1000);
  
});
