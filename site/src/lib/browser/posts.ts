import type { setLineMarkersForPosts } from "./markers";

type MarkersApi = ReturnType<typeof setLineMarkersForPosts>;

export const handlePostEvents = ({
  markers,
  shownMarkers,
}: {
  markers: MarkersApi;
  shownMarkers: Set<number>;
}) => {
  const postTopOffset = 200;
  const posts: NodeListOf<HTMLElement> = document.querySelectorAll(".post");
  const postContainer = document.querySelector(".posts");
  if (postContainer) {
    postContainer.addEventListener("scroll", () => {
      // console.log('>', event)
    });

    posts.forEach((post) => {
      post.addEventListener("animationstart", (event) => {
        const postDiv = event.target as HTMLDivElement | null;
        if (!postDiv) {
          console.warn("no post div");
          return;
        }

        const postDate = +(postDiv.dataset.dateval ?? 0);
        if (typeof postDate === "number" && postDate) {
          markers.showOne(postDate);
          shownMarkers.add(postDate);
        } else {
          console.log("no postDate");
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
