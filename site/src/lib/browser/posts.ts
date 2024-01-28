export const handlePostEvents = () => {
  const postTopOffset = 200;
  const posts: NodeListOf<HTMLElement> = document.querySelectorAll(".post");
  const postContainer = document.querySelector(".posts");
  if (postContainer) {
    // postContainer.addEventListener("scroll", () => {
    // console.log('>', event)
    // });

    posts.forEach((post) => {
      post.addEventListener("animationstart", (event) => {
        const postDiv = event.target as HTMLDivElement | null;
        if (!postDiv) {
          console.warn("no post div");
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
