(async function () {
  if (!requireAuth()) return;
  initNav();
  const id = new URLSearchParams(location.search).get('id') || store.user.id;
  const head = document.getElementById('profileHead'), postsBox = document.getElementById('userPosts');
  let user;

  async function load() {
    try { user = await api('/users/' + id); } catch (e) {
      head.innerHTML = `<div class="empty"><h3>User not found</h3>This profile doesn't exist. <a href="/" class="muted">Back to feed</a></div>`; return;
    }
    head.innerHTML = `<div class="profile-head">${avatar(user, 110)}
      <div style="flex:1;min-width:200px"><h1 style="margin:0">${esc(user.name)}</h1><div class="muted">@${esc(user.username)}</div>
        <p>${esc(user.bio)}</p>
        <div class="profile-stats">
          <div><b>${user.postsCount}</b><span class="muted">Posts</span></div>
          <div><b id="fCount">${user.followersCount}</b><span class="muted">Followers</span></div>
          <div><b>${user.followingCount}</b><span class="muted">Following</span></div></div>
        ${user.isMe ? '<button class="btn outline" id="editBtn">Edit Profile</button>'
          : `<button class="btn ${user.isFollowing ? 'outline' : ''}" id="followBtn">${user.isFollowing ? 'Following' : 'Follow'}</button>`}
      </div></div>`;
    document.title = user.name + ' · ConnectHub';
    document.getElementById('followBtn')?.addEventListener('click', toggleFollow);
    document.getElementById('editBtn')?.addEventListener('click', openEdit);
  }

  async function toggleFollow() {
    try {
      const r = await api(`/users/${id}/follow`, { method: user.isFollowing ? 'DELETE' : 'POST' });
      toast(r.message); await load();
    } catch (e) { toast(e.message, 'error'); }
  }

  function openEdit() {
    let picture = user.profilePicture;
    const modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = `<form class="card"><h2 style="margin:0">Edit Profile</h2>
      <label>Full name<input class="input" name="name" value="${esc(user.name)}" maxlength="60" required></label>
      <label>Bio<textarea name="bio" rows="3" maxlength="200">${esc(user.bio)}</textarea></label>
      <label>Profile picture<input type="file" name="pic" accept="image/*"></label>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn outline" id="cancelEdit">Cancel</button><button class="btn">Save changes</button></div></form>`;
    document.body.appendChild(modal);
    modal.querySelector('#cancelEdit').onclick = () => modal.remove();
    modal.querySelector('[name=pic]').onchange = async (e) => {
      try { picture = await readImage(e.target.files[0], 1); } catch (err) { toast(err.message, 'error'); e.target.value = ''; }
    };
    modal.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const updated = await api('/users/' + id, { method: 'PUT', body: { name: e.target.name.value, bio: e.target.bio.value, profilePicture: picture } });
        store.setUser({ id: updated.id, name: updated.name, username: updated.username, profilePicture: updated.profilePicture });
        modal.remove(); toast('Profile updated.'); initNav(); await load(); loadPosts();
      } catch (err) { toast(err.message, 'error'); }
    };
  }

  async function loadPosts() {
    try {
      const posts = await api('/posts?user=' + id);
      postsBox.innerHTML = posts.length ? posts.map(postHTML).join('') : emptyPosts(user?.isMe);
    } catch (e) { toast(e.message, 'error'); }
  }

  bindPostActions(postsBox, () => { load(); if (!postsBox.querySelector('.post')) postsBox.innerHTML = emptyPosts(user?.isMe); });
  await load(); if (user) loadPosts();
})();
