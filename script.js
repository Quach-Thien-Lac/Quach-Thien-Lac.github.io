let allPosts = [];
const postTypes = ['fiction', 'non-fiction', 'poetry', 'features'];

async function loadAllPosts() {
    // Load all posts from the archive folder
    try {
        const fetchPromises = postTypes.map(async (type)=> fetch(`./archive/${type}.json`).then(res => res.json()));
        const response = await Promise.all(fetchPromises);
        const data = await response.json();
        allPosts = data.flat();
        console.log("All posts loaded:", allPosts);
        renderAllPosts(allPosts, "#fiction");
    }
    catch (error) {
        console.error("Error loading posts:", error);
    }
}

function renderAllPosts(posts, selector) {
    // clear existing posts then render new ones into the container specified by selector
    const container = document.querySelector(selector);
    container.innerHTML = "";
    const template = document.getElementById("post-card-template");
    posts.forEach(post => {
        // render according to the template in index.html
        const postCard = template.content.cloneNode(true);
        postCard.querySelector(".post-card-title").textContent = post.title;
        postCard.querySelector(".post-card-subtitle").textContent = post.subtitle;
        const readMoreButton = postCard.querySelector(".read-more-button");
        readMoreButton.dataset.postId = post.id;
        readMoreButton.addEventListener("click", () => {
            openPost(post.id);
        });
        container.appendChild(postCard);
    });

}

document.addEventListener("DOMContentLoaded", () => {
    loadAllPosts();
    // handle click events 
    document.addEventListener("click", (event) => {
        // if click read more then switch to reader view and load the post content
        if (event.target.classList.contains("read-more-button")) {
            const postId = event.target.dataset.postId;
            openReader(postId);
        }
        // if click back button then return to post selector view
        if (event.target.id === "back-button") {
            document.querySelector("#post-reader").classList.add("hidden");
            document.querySelector("#post-selector").classList.remove("hidden");
        }
        //if click nav item then filter posts by category and render them in the post selector view
        if (event.target.classList.contains("nav-item")) {
            const category = event.target.dataset.category;

            const fileteredPosts = allPosts.filter(post => post.category === category);
            renderAllPosts(fileteredPosts, "#posts");

            document.querySelector("#post-reader").classList.add("hidden");
            document.querySelector("#post-selector").classList.remove("hidden");
        }
    });
});

function openReader(postId) {
    const post = allPosts.find(p => p.id === postId);

    if (post) {
        document.querySelector("#post-title").textContent = post.title;
        document.querySelector("#post-content").textContent = post.content;

        document.querySelector("#post-selector").classList.add("hidden");
        document.querySelector("#post-reader").classList.remove("hidden");
    }
    else {
        console.error("Post not found:", postId);
    }
}