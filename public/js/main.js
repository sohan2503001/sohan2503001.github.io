//const blogList = document.getElementById("blogList");
//const postContent = document.getElementById("postContent");

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

function displayBlogList() {
  const blogList = document.getElementById('blogList');
  if (blogList) {
    blogList.innerHTML = '';
    blogPosts.forEach((post) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `<a href="/post/${post.id}">${post.title}</a>`;
      blogList.appendChild(listItem);
    });
  }
}

function displayPostContent(postId) {
  const postContent = document.getElementById('postContent');
  if (postContent) {
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
}

// Check if we are on the index.html page
if (window.location.pathname === '/') {
  displayBlogList();
}

// Check if we are on the post.html page
if (window.location.pathname.startsWith('/post/')) {
  const postId = window.location.pathname.split('/post/')[1];
  displayPostContent(postId);
}
