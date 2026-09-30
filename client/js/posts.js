// Post + comment rendering, shared by feed and profile pages
function postHTML(p) {
  const me = store.user, mine = p.author._id === me.id;
  return `<article class="card post" data-id="${p.id}">
    <div class="post-head">
      <a href="/profile.html?id=${p.author._id}">${avatar(p.author)}</a>
      <div class="grow"><a href="/profile.html?id=${p.author._id}"><b>${esc(p.author.name)}</b></a>
        ${p.feeling ? `<span class="muted"> is feeling ${esc(p.feeling)}</span>` : ''}
        <div class="muted">@${esc(p.author.username)} · ${timeAgo(p.createdAt)}</div></div>
      ${mine ? '<button class="link-danger" data-act="delete">Delete</button>' : ''}
    </div>
    ${p.content ? `<p class="post-text">${esc(p.content)}</p>` : ''}
    ${p.image ? `<img class="post-img" src="${esc(p.image)}" alt="Post image">` : ''}
    <div class="post-actions">
      <button class="act like ${p.liked ? 'liked' : ''}" data-act="like">${p.liked ? '❤️ Liked' : '🤍 Like'} <span class="lc">${p.likesCount}</span></button>
      <button class="act" data-act="comments">💬 Comment <span class="cc">${p.commentsCount}</span></button>
    </div>
    <div class="comments hidden"></div>
  </article>`;
}

function commentHTML(c) {
  return `<div class="comment" data-cid="${c._id}">${avatar(c.author, 32)}
    <div class="bubble"><b>${esc(c.author.name)}</b> <span class="muted">@${esc(c.author.username)} · ${timeAgo(c.createdAt)}</span>
    <div>${esc(c.content)}</div>
    ${c.author._id === store.user.id ? '<button class="link-danger" data-act="del-comment">Delete</button>' : ''}</div></div>`;
}

async function toggleComments(card) {
  const box = card.querySelector('.comments');
  if (!box.classList.contains('hidden')) return box.classList.add('hidden');
  const comments = await api(`/posts/${card.dataset.id}/comments`);
  box.innerHTML = `<div class="list">${comments.length ? comments.map(commentHTML).join('') : '<p class="muted empty-note">No comments yet. Start the conversation!</p>'}</div>
    <form class="comment-form"><input placeholder="Write a comment..." maxlength="500" aria-label="Write a comment"><button class="btn">Send</button></form>`;
  box.classList.remove('hidden');
  box.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    try {
      const c = await api(`/posts/${card.dataset.id}/comments`, { method: 'POST', body: { content: input.value } });
      box.querySelector('.empty-note')?.remove();
      box.querySelector('.list').insertAdjacentHTML('beforeend', commentHTML(c));
      input.value = ''; card.querySelector('.cc').textContent = +card.querySelector('.cc').textContent + 1;
      toast('Comment added.');
    } catch (err) { toast(err.message, 'error'); }
  };
}

// One delegated handler per container handles like / comment / delete
function bindPostActions(container, onChange) {
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const card = btn.closest('.post'), id = card.dataset.id;
    try {
      if (btn.dataset.act === 'like') {
        const liked = btn.classList.contains('liked');
        const r = await api(`/posts/${id}/like`, { method: liked ? 'DELETE' : 'POST' });
        btn.classList.toggle('liked', r.liked);
        btn.innerHTML = `${r.liked ? '❤️ Liked' : '🤍 Like'} <span class="lc">${r.likesCount}</span>`;
        if (r.liked) toast('You liked this post.');
      } else if (btn.dataset.act === 'comments') {
        await toggleComments(card);
      } else if (btn.dataset.act === 'delete') {
        if (!confirm('Delete this post? This cannot be undone.')) return;
        await api(`/posts/${id}`, { method: 'DELETE' });
        card.remove(); toast('Post deleted.'); onChange?.();
      } else if (btn.dataset.act === 'del-comment') {
        const c = btn.closest('.comment');
        await api(`/comments/${c.dataset.cid}`, { method: 'DELETE' });
        c.remove(); const cc = card.querySelector('.cc'); cc.textContent = Math.max(0, +cc.textContent - 1);
        toast('Comment deleted.');
      }
    } catch (err) { toast(err.message, 'error'); }
  });
}

function emptyPosts(own) {
  return `<div class="card empty"><h3>No posts yet</h3>${own ? 'Share your first thought with the community!' : 'Be the first to share something with the community!'}</div>`;
}
