(async function () {
  if (!requireAuth()) return;
  initNav();
  const me = store.user;
  const feed = document.getElementById('feed');
  let image = '', feeling = '';

  document.getElementById('welcomeName').textContent = me.name.split(' ')[0];
  document.getElementById('postText').placeholder = `What's on your mind, ${me.name.split(' ')[0]}?`;
  document.getElementById('miniAvatar').innerHTML = avatar(me, 64);
  document.getElementById('miniName').textContent = me.name;
  document.getElementById('miniUser').textContent = '@' + me.username;
  document.getElementById('miniLink').href = '/profile.html?id=' + me.id;

  async function loadFeed() {
    try {
      const posts = await api('/posts');
      feed.innerHTML = posts.length ? posts.map(postHTML).join('') : emptyPosts(false);
    } catch (e) { toast(e.message, 'error'); }
  }
  async function loadStats() {
    try {
      const [s, profile] = await Promise.all([api('/users/stats/community'), api('/users/' + me.id)]);
      document.getElementById('statUsers').textContent = s.users;
      document.getElementById('statPosts').textContent = s.posts;
      document.getElementById('miniFollowers').textContent = profile.followersCount;
      document.getElementById('miniFollowing').textContent = profile.followingCount;
    } catch {}
  }

  document.getElementById('feelingSel').onchange = (e) => { feeling = e.target.value; };
  document.getElementById('photoInput').onchange = async (e) => {
    try {
      image = await readImage(e.target.files[0]);
      document.getElementById('preview').innerHTML = `<img src="${image}" alt="Preview"><button type="button" class="link-danger" id="rmImg">Remove photo</button>`;
      document.getElementById('rmImg').onclick = () => { image = ''; document.getElementById('preview').innerHTML = ''; e.target.value = ''; };
    } catch (err) { toast(err.message, 'error'); e.target.value = ''; }
  };

  document.getElementById('composer').onsubmit = async (e) => {
    e.preventDefault();
    const text = document.getElementById('postText'), btn = document.getElementById('postBtn');
    if (!text.value.trim() && !image) return toast('Please enter some content before posting.', 'error');
    btn.disabled = true;
    try {
      const post = await api('/posts', { method: 'POST', body: { content: text.value, image, feeling } });
      if (!feed.querySelector('.post')) feed.innerHTML = '';
      feed.insertAdjacentHTML('afterbegin', postHTML(post));
      text.value = ''; image = ''; feeling = '';
      document.getElementById('preview').innerHTML = ''; document.getElementById('feelingSel').value = ''; document.getElementById('photoInput').value = '';
      toast('Post created successfully.'); loadStats();
    } catch (err) { toast(err.message, 'error'); }
    btn.disabled = false;
  };

  bindPostActions(feed, () => { if (!feed.querySelector('.post')) feed.innerHTML = emptyPosts(false); loadStats(); });
  loadFeed(); loadStats();
})();
