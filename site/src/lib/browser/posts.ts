const postOffsets: Record<number, number> = {};
const topHeaderAvoidanceShort = 160;
const topHeaderAvoidanceTall = 100;

export const handlePostEvents = () => {
  const mainElement = document.querySelector("main");
  if (!mainElement) {
    throw new Error("Need main element height for scroll logic");
  }
  const viewportHeight = mainElement.getBoundingClientRect().height;
  const posts: NodeListOf<HTMLElement> = document.querySelectorAll(".post");
  const postContainer = document.querySelector(".posts");
  if (postContainer) {
    posts.forEach((post, index) => {
      const postDiv = post as HTMLDivElement | null;
      if (!postDiv) {
        console.warn("no post div");
        return;
      }
      const postBoundingRect = postDiv.getBoundingClientRect();
      postOffsets[index] =
        postBoundingRect.top -
        (postBoundingRect.height / viewportHeight > 0.75
          ? topHeaderAvoidanceTall
          : topHeaderAvoidanceShort);
      post.addEventListener("animationstart", (event) => {
        if (postDiv.classList.contains("post") === false) {
          // child events may bubble up
          return;
        }

        const top = postOffsets[index];
        postContainer.scrollTo({
          behavior: "smooth",
          top,
        });
      });
    });
  }
};
