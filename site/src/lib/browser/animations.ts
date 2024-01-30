let paused = false;

export const getAnimationState = () => {
  return paused ? "paused" : "playing";
};

const updatePostAnimations = (playState: "paused" | "running") => {
  document.querySelectorAll(".post").forEach((post) => {
    (post as HTMLDivElement).style.animationPlayState = playState;
  });

  document.querySelectorAll(".post-load-bar-fill").forEach((postBar) => {
    (postBar as HTMLDivElement).style.animationPlayState = playState;
  });
};

const pauseAllAnimations = () => {
  paused = true;
  // const animations = document.getAnimations();
  // animations.forEach((anim) => anim.pause());
  updatePostAnimations("paused");
  (document.querySelector("#filledchart") as SVGSVGElement).pauseAnimations();
};

const resumeAllAnimations = () => {
  paused = false;
  // const animations = document.getAnimations();
  // animations.forEach((anim) => anim.play());
  updatePostAnimations("running");
  (document.querySelector("#filledchart") as SVGSVGElement).unpauseAnimations();
};

export const toggleAnimationState = () => {
  const state = getAnimationState();
  switch (state) {
    case "paused":
      resumeAllAnimations();
      break;
    case "playing":
      pauseAllAnimations();
      break;
  }
};
