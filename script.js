const categories = ["fiction", "nonfiction", "poetry", "feature"];
const navToFileMap = {
    fiction: "fiction",
    "non-fiction": "nonfiction",
    poetry: "poetry",
    features: "feature",
};

const postsByCategory = {};
let allPosts = [];
let activePosts = [];

function getPostImage(post) {
    return post?.image ?? post?.banner ?? post?.img ?? post?.cover ?? "";
}

function normalizePosts(payload, category) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.posts)) {
        return payload.posts;
    }

    if (payload && typeof payload === "object" && Object.keys(payload).length > 0) {
        return Object.entries(payload).map(([id, post]) => ({
            ...post,
            id: post.id ?? id,
            category,
        }));
    }

    return [];
}

async function loadCategory(category) {
    try {

        const response = await fetch(`./archive/${category}.json`);
        if (!response.ok) {
            return [];
        }

        const text = await response.text();
        if (!text.trim()) {
            return [];
        }

        const payload = JSON.parse(text);
        return normalizePosts(payload, category).map((post, index) => ({
            ...post,
            category: post.category ?? category,
            id: post.id ?? `${category}-${index}`,
        }));
    } catch (error) {
        console.error(`Error loading ${category}:`, error);
        return [];
    }
}

async function loadAllPosts() {
    const loaded = await Promise.all(categories.map((category) => loadCategory(category)));

    categories.forEach((category, index) => {
        postsByCategory[category] = loaded[index];
    });

    allPosts = loaded.flat();
    activePosts = postsByCategory.fiction ?? [];
    renderSelector(activePosts);
}

function renderSelector(posts) {
    const heroPost = posts.length > 0 ? posts[0] : null;
    const gridPosts = posts.length > 1 ? posts.slice(1) : [];

    renderHero(heroPost);
    renderGrid(gridPosts);
}

function renderHero(post) {
    const heroTitle = document.querySelector("#hero-title");
    const heroSubtitle = document.querySelector("#hero-subtitle");
    const heroButton = document.querySelector("#hero-button");
    const heroContainer = document.querySelector("#hero-container");

    if (!heroTitle || !heroSubtitle || !heroButton || !heroContainer) {
        return;
    }

    if (!post) {
        heroTitle.textContent = "No posts yet";
        heroSubtitle.textContent = "Write something now!";
        heroButton.classList.add("hidden");
        heroButton.removeAttribute("data-post-id");
        heroContainer.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55))";
        return;
    }

    heroTitle.textContent = post.title ?? "Untitled post";
    heroSubtitle.textContent = post.subtitle ?? "";
    heroButton.classList.remove("hidden");
    heroButton.dataset.postId = post.id;

    const image = getPostImage(post);
    heroContainer.style.backgroundImage = image
        ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("${image}")`
        : "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55))";
}

function renderGrid(posts) {
    const container = document.querySelector("#grid-container");
    const template = document.getElementById("post-card-template");

    if (!container || !template) {
        return;
    }

    container.innerHTML = "";

    posts.forEach((post) => {
        const postCard = template.content.cloneNode(true);
        postCard.querySelector(".post-card-title").textContent = post.title ?? "Untitled post";
        postCard.querySelector(".post-card-subtitle").textContent = post.subtitle ?? "";

        const readMoreButton = postCard.querySelector(".read-more-button") ?? postCard.querySelector("#read-more-button");
        if (readMoreButton) {
            readMoreButton.classList.add("read-more-button");
            readMoreButton.dataset.postId = post.id;
            readMoreButton.addEventListener("click", () => {
                openReader(post.id);
            });
        }

        container.appendChild(postCard);
    });
}

function openReader(postId) {
    const post = allPosts.find((item) => String(item.id) === String(postId));

    if (!post) {
        console.error("Post not found:", postId);
        return;
    }

    const postReader = document.querySelector("#post-reader");
    const readerImage = document.querySelector("#reader-image");
    const readerTitle = document.querySelector("#reader-title");
    const readerSubtitle = document.querySelector("#reader-subtitle");
    const readerContent = document.querySelector("#reader-content");

    if (readerImage) {
        const image = getPostImage(post);
        if (image) {
            readerImage.style.backgroundImage = `url("${image}")`;
            readerImage.style.minHeight = "260px";
        } else {
            readerImage.style.backgroundImage = "none";
            readerImage.style.minHeight = "0";
        }
    }

    if (readerTitle) readerTitle.textContent = post.title ?? "Untitled post";
    if (readerSubtitle) readerSubtitle.textContent = post.subtitle ?? "";
    if (readerContent) readerContent.textContent = post.content ?? "";

    document.querySelector("#post-selector")?.classList.add("hidden");
    postReader?.classList.remove("hidden");
}

function showSelectorForCategory(navCategory) {
    const fileCategory = navToFileMap[navCategory] ?? "fiction";

    // If the user selected the Archive/Features nav, show all posts
    if (navCategory === 'features' || navCategory === 'archive' || navCategory === 'all') {
        activePosts = allPosts ?? [];
    } else {
        activePosts = postsByCategory[fileCategory] ?? [];
    }

    renderSelector(activePosts);

    document.querySelector("#post-reader")?.classList.add("hidden");
    document.querySelector("#post-selector")?.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    loadAllPosts();

    const directBack = document.querySelector('#back-button');
    if (directBack) {
        directBack.addEventListener('click', () => {
            document.querySelector('#post-reader')?.classList.add('hidden');
            document.querySelector('#post-selector')?.classList.remove('hidden');
        });
    }

    document.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        const navLink = target.closest("a[data-category]");
        if (navLink) {
            event.preventDefault();
            const navCategory = navLink.dataset.category;
            if (navCategory) {
                showSelectorForCategory(navCategory);
            }
            return;
        }

        if (target.id === "back-button") {
            document.querySelector("#post-reader")?.classList.add("hidden");
            document.querySelector("#post-selector")?.classList.remove("hidden");
            return;
        }

        if (target.id === "hero-button") {
            const postId = target.dataset.postId;
            if (postId) {
                openReader(postId);
            }
            return;
        }

        if (target.classList.contains("read-more-button")) {
            const postId = target.dataset.postId;
            if (postId) {
                openReader(postId);
            }
        }
    });
});