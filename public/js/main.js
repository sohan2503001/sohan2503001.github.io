const blogList = document.getElementById("blogList");
const postContent = document.getElementById("postContent");

const blogPosts = [
  {
    id: 1,
    title: "चमत्कारी दामाद अध्याय 1",
    filename: "post1.txt", // The filename for the first blog post content
  },
  {
    id: 2,
    title: "चमत्कारी दामाद अध्याय 2",
    filename: "post2.txt", // The filename for the second blog post content
  },
];

function displayBlogPosts() {
  blogList.innerHTML = "";

  blogPosts.forEach((post) => {
    const postLink = document.createElement("a");
    postLink.href = `/post/${post.id}`;
    postLink.textContent = post.title;
    blogList.appendChild(postLink);
  });
}

function displayPostContent(postId) {
  const post = blogPosts.find((post) => post.id === parseInt(postId, 10));

  if (post) {
    fetch(`/content/${post.filename}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Blog post content not found.');
        }
        return response.text();
      })
      .then((content) => {
        postContent.innerHTML = `
          <div class="post-content">
            <h2>${post.title}</h2>
            <p>${content.replace(/\n/g, '<br>')}</p>
          </div>
        `;
      })
      .catch((error) => {
        postContent.innerHTML = `<p>Error loading blog post content: ${error.message}</p>`;
        console.error(error);
      });
  } else {
    postContent.innerHTML = '<p>Blog post not found.</p>';
  }
}

const path = window.location.pathname;
const postId = path.split("/post/")[1];

if (path === "/") {
  displayBlogPosts();
} else if (path.startsWith("/post/") && postId) {
  displayPostContent(postId);
} else {
  postContent.innerHTML = "<p>Page not found.</p>";
}
