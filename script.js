
const categories = ["fiction", "nonfiction", "poetry", "feature"];
const navToFileMap = {
    fiction: "fiction",
    "non-fiction": "nonfiction",
    poetry: "poetry",
    feature: "feature",
};

const postsByCategory = {};
let allPosts = [];
let activePosts = [];

function getPostImage(post) {
    return post?.image ?? post?.banner ?? post?.img ?? post?.cover ?? "";
}

function normalizePosts(payload, category) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.posts)) return payload.posts;
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
        if (!response.ok) return [];
        
        const text = await response.text();
        if (!text.trim()) return [];

        const payload = JSON.parse(text);
        return normalizePosts(payload, category).map((post, index) => ({
            ...post,
            category: post.category ?? category,
            id: post.id ?? `${category}-${index}`,
        }));
    } catch (error) {
        console.error(`Failed to load category: ${category}`, error);
        return [];
    }
}

async function loadAllPosts() {
    const localFetches = await Promise.all(categories.map((category) => loadCategory(category)));

    categories.forEach((category, index) => {
        postsByCategory[category] = localFetches[index];
    });

    allPosts = localFetches.flat();
    activePosts = postsByCategory.fiction?.length ? postsByCategory.fiction : allPosts;
    renderSelector(activePosts);

    try {
        window.debugPosts = allPosts;
    } catch (e) {
    }

    document.querySelector('#post-reader')?.classList.add('hidden');
    document.querySelector('#post-selector')?.classList.remove('hidden');
}

function createPostCard(post, { empty = false } = {}) {
    const gridItem = document.createElement("div");
    gridItem.className = "grid-item";

    const image = document.createElement("div");
    image.id = "post-image";

    const titleNode = document.createElement("h4");
    titleNode.id = "post-title";

    const subtitleNode = document.createElement("p");
    subtitleNode.id = "post-subtitle";

    const readMoreButton = document.createElement("button");
    readMoreButton.className = "read-more-button";
    readMoreButton.type = "button";
    readMoreButton.textContent = empty ? "Read More" : "Read More";

    if (empty) {
        titleNode.textContent = "No posts yet";
        subtitleNode.textContent = "Write one now!";
    } else {
        const postImage = getPostImage(post);
        image.style.backgroundImage = postImage ? `url("${postImage}")` : "none";
        titleNode.textContent = post.title ?? "Untitled post";
        subtitleNode.textContent = post.subtitle ?? "";
        readMoreButton.dataset.postId = post.id;
    }

    gridItem.append(image, titleNode, subtitleNode, readMoreButton);
    return gridItem;
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
    const heroContainer = document.querySelector("#hero-container");
    const heroButton = heroContainer?.querySelector(".read-more-button");

    if (!heroTitle || !heroSubtitle || !heroButton || !heroContainer) return;

    if (!post) {
        heroTitle.textContent = "No posts yet";
        heroSubtitle.textContent = "Write something now!";
        heroButton.classList.add("hidden");
        heroButton.removeAttribute("data-post-id");
        heroButton.textContent = "Read more";
        heroContainer.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55))";
        return;
    }

    heroTitle.textContent = post.title ?? "Untitled post";
    heroSubtitle.textContent = post.subtitle ?? "";
    heroButton.classList.remove("hidden");
    heroButton.dataset.postId = post.id;
    heroButton.textContent = "Read more";

    const image = getPostImage(post);
    heroContainer.style.backgroundImage = image
        ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("${image}")`
        : "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55))";
}

function renderGrid(posts) {
    const container = document.querySelector("#grid-container");
    if (!container) return;

    container.innerHTML = "";

    if (posts.length === 0) {
        container.appendChild(createPostCard(null, { empty: true }));
        return;
    }

    posts.forEach((post) => {
        container.appendChild(createPostCard(post));
    });
}

function openReader(postId) {
    const post = allPosts.find((item) => String(item.id) === String(postId));
    if (!post) return;

    const postReader = document.querySelector("#post-reader");
    const readerImage = document.querySelector("#reader-image");
    const readerTitle = document.querySelector("#reader-title");
    const readerSubtitle = document.querySelector("#reader-subtitle");
    const readerContent = document.querySelector("#reader-content");

    if (readerImage) {
        const image = getPostImage(post);
        if (image) {
            readerImage.src = image;
            readerImage.alt = post.title ?? "Post image";
        } else {
            readerImage.removeAttribute("src");
            readerImage.alt = "";
        }
    }

    if (readerTitle) readerTitle.textContent = post.title ?? "Untitled post";
    if (readerSubtitle) readerSubtitle.textContent = post.subtitle ?? "";
    
    if (readerContent) readerContent.innerHTML = post.content ?? "";

    document.querySelector("#post-selector")?.classList.add("hidden");
    postReader?.classList.remove("hidden");
}

function showSelectorForCategory(navCategory) {
    const fileCategory = navToFileMap[navCategory] ?? "fiction";

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

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const navLink = target.closest("a[data-category]");
        if (navLink) {
            event.preventDefault();
            const navCategory = navLink.dataset.category;
            if (navCategory) showSelectorForCategory(navCategory);
            return;
        }

        if (target.id === "back-button") {
            document.querySelector("#post-reader")?.classList.add("hidden");
            document.querySelector("#post-selector")?.classList.remove("hidden");
            return;
        }

        const readMoreButton = target.closest(".read-more-button");
        if (readMoreButton instanceof HTMLButtonElement) {
            const postId = readMoreButton.dataset.postId;
            if (postId) openReader(postId);
        }
    });
});