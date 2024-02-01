const updatePostAnimations = (playState: "paused" | "running") => {
  document.querySelectorAll(".post").forEach((post) => {
    (post as HTMLDivElement).style.animationPlayState = playState;
  });

  document.querySelectorAll(".post-load-bar-fill").forEach((postBar) => {
    (postBar as HTMLDivElement).style.animationPlayState = playState;
  });
};

export const pauseAllAnimations = () => {
  updatePostAnimations("paused");
  (document.querySelector("#filledchart") as SVGSVGElement).pauseAnimations();
};

export const resumeAllAnimations = () => {
  updatePostAnimations("running");
  (document.querySelector("#filledchart") as SVGSVGElement).unpauseAnimations();
};

export const fastForwardAnimations = () => {
  document.getAnimations().forEach((anim) => {
    anim.finish();
  });
  (document.querySelector("#filledchart") as SVGSVGElement).setCurrentTime(
    (Date.now() + 30_000) / 1_000
  );
};

export const listenForAnimationComplete = (listener: () => void) => {
  // for some reason endEvent doesn't work, but this is close enough
  (
    document.querySelector(
      ".svg-days text:last-of-type animate"
    ) as SVGAnimateElement
  ).addEventListener("beginEvent", listener);
};
