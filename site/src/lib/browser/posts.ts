export const handlePostEvents = () => {
  const mainElement = document.querySelector("main");
  if (!mainElement) {
    throw new Error("Need main element height for scroll logic");
  }
  const postTopOffset = mainElement.getBoundingClientRect().height * 0.333;
  const posts: NodeListOf<HTMLElement> = document.querySelectorAll(".post");
  const postContainer = document.querySelector(".posts");
  if (postContainer) {
    posts.forEach((post) => {
      post.addEventListener("animationstart", (event) => {
        const postDiv = event.target as HTMLDivElement | null;
        if (!postDiv) {
          console.warn("no post div");
          return;
        }

        if (postDiv.classList.contains("post") === false) {
          // child events may bubble up
          return;
        }

        const top =
          postDiv.getBoundingClientRect().top -
          postTopOffset +
          postContainer.scrollTop -
          100;
        postContainer.scrollTo({
          behavior: "smooth",
          top,
        });
      });
    });
  }
};
