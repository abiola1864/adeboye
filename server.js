require('dotenv').config();
const express   = require('express');
const session   = require('express-session');
const mongoose  = require('mongoose');
const slugify   = require('slugify');
const multer    = require('multer');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Schemas ───────────────────────────────────────────────────────
const postSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  slug:      { type: String, required: true, unique: true },
  category:  { type: String, default: 'General' },
  excerpt:   String,
  content:   String,
  image_url: String,
  is_new:    { type: Boolean, default: true },
  read_time: { type: String, default: '5 min read' },
  published: { type: Boolean, default: false },
  likes:     { type: Number, default: 0 },
  shares:    { type: Number, default: 0 },
  views:     { type: Number, default: 0 },
  order:     { type: Number, default: 0 }, // for manual ordering
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  post_slug:    { type: String, required: true, index: true },
  parent_id:    { type: mongoose.Schema.Types.ObjectId, default: null },
  author_name:  { type: String, required: true },
  author_email: { type: String, required: true },
  body:         { type: String, required: true },
  likes:        { type: Number, default: 0 },
  approved:     { type: Boolean, default: true },
}, { timestamps: true });

const subscriberSchema = new mongoose.Schema({
  name:  String,
  email: { type: String, required: true, unique: true },
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  name: String, email: String, subject: String, message: String,
}, { timestamps: true });

const Post       = mongoose.model('Post', postSchema);
const Comment    = mongoose.model('Comment', commentSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Message    = mongoose.model('Message', messageSchema);

// ── Article content ───────────────────────────────────────────────
const reformContent = `<p class="drop-cap">A country cannot modernize its economy while preserving a 1970s bureaucracy. Every nation pays for the quality of its governance. Some pay upfront through competitive compensation, performance systems and disciplined institutions. Others pay later through corruption, inefficiency and squandered national potential. Nigeria has chosen the latter for decades — and the bill is now crippling.</p>
<p>At the heart of Nigeria's governance crisis lies a structural contradiction: the people who must approve reform are the primary beneficiaries of the dysfunction, while those expected to run the state are underpaid, under-protected and undermined. This is not merely a governance problem. It is a design flaw baked into the architecture of the Nigerian state.</p>
<h2>A Political Class Rewarded for Weak Institutions</h2>
<p>Relative to national income, Nigeria's political elite enjoys one of the world's most generous compensation ecosystems — a system built on opaque allowances, constituency project funds, discretionary perks and privileged access to state resources. Meanwhile, the civil servants who actually implement policy earn salaries that cannot sustain dignity, independence or professionalism.</p>
<p>The result is a two-tiered state: a political class insulated from economic reality, and a bureaucracy trapped in survival mode. No country builds strong institutions on such an unequal foundation.</p>
<h2>A Bureaucracy Underpaid into Corruption</h2>
<p>Nigeria's civil servants are not inherently corrupt. Too often, the system makes corruption a condition of survival. When a director earns less than a mid-level private sector employee, and a junior officer earns less than a ride-hailing driver, the system is not merely unfair — it is structurally engineered to fail.</p>
<p>Underpaid bureaucrats face pressure to inflate contracts, incentives to run contracts themselves, dependence on facilitation fees, and vulnerability to political manipulation. Economists call this a low equilibrium trap: a system where everyone behaves badly, because behaving well is economically irrational.</p>
<h2>Singapore Shows the Opposite Model</h2>
<p>Singapore's transformation rests on a simple principle: if you want integrity, eliminate the economic incentive for corruption. It pays public servants, including ministers, competitive salaries benchmarked to the private sector. The result is a bureaucracy that attracts top talent, delivers with precision and ranks among the least corrupt globally. Nigeria has done the opposite: it underpays those who handle public resources and overpays those who control political power.</p>
<h2>A Missing Link: Performance Measurement</h2>
<p>Nigeria's public service remains one of the few in the world where performance is neither measured nor rewarded. Productivity is not tracked. Excellence is not incentivized. Poor performance is rarely penalized. A system that does not measure cannot improve.</p>
<p>Countries like South Korea, Japan and Norway built high-performing bureaucracies by embedding basic disciplines: key performance indicators, service delivery benchmarks, transparent reporting and citizen feedback loops.</p>
<h2>The Oronsaye Report: A Blueprint Without a Builder</h2>
<p>The Oronsaye Report remains the most comprehensive attempt at rationalizing Nigeria's bureaucratic bloat. It recommended merging 102 agencies, scrapping 38, reclassifying 14, and strengthening 52. Successive governments have praised the report. None has implemented it.</p>
<p>Why? Because the reforms would cut political allowances, reduce patronage networks, shrink opportunities for rent-seeking, strengthen bureaucratic autonomy, and impose performance discipline. The Oronsaye Report threatens the very incentives that keep the political class comfortable.</p>
<div class="pull-quote">&ldquo;Nigeria does not lack a roadmap. It lacks the political will to stop benefiting from dysfunction.&rdquo;</div>
<h2>What Nigeria Must Do</h2>
<ul class="reform-list">
  <li><strong>Competitive, transparent pay for civil servants</strong> — Benchmark salaries to private sector equivalents.</li>
  <li><strong>Performance-based progression</strong> — Reward competence, not connections.</li>
  <li><strong>Consolidation of political allowances</strong> — Replace opacity with clear, taxable compensation.</li>
  <li><strong>Revenue generation mandates</strong> — Every agency must justify its existence.</li>
  <li><strong>Digitized procurement and payroll</strong> — Eliminate leakages and ghost workers.</li>
  <li><strong>Protection of civil servants from political interference</strong> — A secure bureaucracy is a productive one.</li>
  <li><strong>Citizen and diaspora oversight</strong> — Transparency grows when more eyes are watching.</li>
</ul>
<h2>A New Social Contract</h2>
<p>Reform is not charity. It is strategy, and a prerequisite for nation building. Nigeria cannot demand integrity from underpaid officials while rewarding excess at the top. These reforms are not radical. They are basic governance hygiene.</p>`;

// ── Force update ALL existing posts with correct data ─────────────
async function fixDatabase() {
  console.log('🔄 Checking and fixing database...');

  // Fix any "Public Policy" → "Reforms"
  const fixedCat = await Post.updateMany(
    { category: { $in: ['Public Policy', 'Reforms', 'Reform Agenda'] } },
    { $set: { category: 'Reform Agenda' } }
  );
  if (fixedCat.modifiedCount > 0) {
    console.log(`✅ Fixed ${fixedCat.modifiedCount} posts: Public Policy → Reforms`);
  }

  // Ensure reform article has full content and correct data
  await Post.findOneAndUpdate(
    { slug: 'the-reform-nigeria-cannot-bring-itself-to-make' },
    {
      $set: {
        category: 'Reform Agenda',
        content: reformContent,
        is_new: true,
        published: true,
        // Set to latest date so it appears first
        updatedAt: new Date('2026-05-16T10:00:00Z')
      }
    }
  );

  // Mark older articles as not new
  await Post.updateMany(
    { slug: { $in: [
      'leadership-culture-and-the-cost-of-weak-public-norms',
      'what-democratic-accountability-requires-beyond-elections',
      'public-policy-in-practice-why-implementation-matters'
    ]}},
    { $set: { is_new: false } }
  );

  // Mark newer ones as new
  await Post.updateMany(
    { slug: { $in: [
      'the-reform-nigeria-cannot-bring-itself-to-make',
      'why-institutions-matter-more-than-individual-leaders'
    ]}},
    { $set: { is_new: true } }
  );

  console.log('✅ Database fixed');
}

// ── Seed if empty ─────────────────────────────────────────────────
async function seedIfEmpty() {
  const count = await Post.countDocuments();
  if (count > 0) return;

  // Insert newest first (highest date = appears first in sort)
  await Post.create([
    {
      title: 'The Reform Nigeria Cannot Bring Itself to Make',
      slug: 'the-reform-nigeria-cannot-bring-itself-to-make',
      category: 'Reform Agenda',
      excerpt: 'Nigeria knows what to fix. It even wrote the blueprint. What it lacks is the political nerve to stop benefiting from dysfunction.',
      content: reformContent,
      image_url: '/img/article-reform.jpg',
      is_new: true, read_time: '9 min read', published: true,
      createdAt: new Date('2026-05-16T10:00:00Z'),
    },
    {
      title: 'Why Institutions Matter More Than Individual Leaders',
      slug: 'why-institutions-matter-more-than-individual-leaders',
      category: 'Institutions',
      excerpt: 'A closer look at how public systems shape incentives, accountability, and long-term outcomes regardless of who sits in power.',
      content: `<p class="drop-cap">Nigeria's governance challenges are often discussed through the actions of individual leaders. But leadership alone cannot explain why public systems succeed, fail, endure, or break down. Institutions matter because they shape incentives, define responsibility, and determine whether public authority serves the common good or private interest.</p>
<h2>What Institutions Actually Do</h2>
<p>An institution is a set of rules, norms, and enforcement mechanisms that determine how people behave — especially when no one is watching. Strong institutions make good behaviour the rational choice, even for self-interested actors.</p>
<div class="pull-quote">&ldquo;Institutions outlast individuals. Rules and incentives shape political behaviour far more than character alone.&rdquo;</div>
<h2>The Nigeria Pattern</h2>
<p>Nigeria exhibits a classic pattern of personality-dependent governance. Each new administration brings hope, new appointments, and policy announcements. But without institutional continuity, the machinery of state cannot sustain progress across leadership transitions.</p>
<p>Nigeria does not need to wait for perfect leaders. It needs to build institutions strong enough that imperfect leaders are constrained, accountable, and replaceable.</p>`,
      is_new: true, read_time: '7 min read', published: true,
      createdAt: new Date('2026-05-09T10:00:00Z'),
    },
    {
      title: 'What Democratic Accountability Requires Beyond Elections',
      slug: 'what-democratic-accountability-requires-beyond-elections',
      category: 'Democracy',
      excerpt: 'Why voting alone is not enough to sustain a healthy democratic culture — and what a functioning accountability system actually demands.',
      content: `<p class="drop-cap">Every four years, Nigeria holds elections. Citizens queue, cast ballots, and wait for results. Yet something essential is missing: accountability between elections.</p>
<div class="pull-quote">&ldquo;Accountability without enforcement is theatre. Democracies require both the formal mechanisms and the political culture to use them.&rdquo;</div>
<p>Democracy is not an event. It is a practice, sustained daily by institutions, norms, and citizens who refuse to accept less than they are owed.</p>`,
      is_new: false, read_time: '6 min read', published: true,
      createdAt: new Date('2026-05-02T10:00:00Z'),
    },
    {
      title: 'Leadership Culture and the Cost of Weak Public Norms',
      slug: 'leadership-culture-and-the-cost-of-weak-public-norms',
      category: 'Leadership',
      excerpt: 'How habits of power affect trust, performance, and the possibility of reform in a society shaped by informal authority.',
      content: `<p class="drop-cap">Leadership culture is invisible until it fails. It is the set of unwritten norms, expectations, and behaviours that determine what is acceptable in positions of power.</p>
<div class="pull-quote">&ldquo;Leadership culture sets the ceiling for what an institution can achieve and the floor for what citizens will accept.&rdquo;</div>
<p>Nigeria has extraordinary talent in its public institutions. What it often lacks is the leadership culture that would allow that talent to thrive.</p>`,
      is_new: false, read_time: '8 min read', published: true,
      createdAt: new Date('2026-04-25T10:00:00Z'),
    },
  ]);
  console.log('✅ Posts seeded');
}

// ── Connect ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URL)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedIfEmpty();
    await fixDatabase();
  })
  .catch(err => { console.error('❌ MongoDB failed:', err.message); process.exit(1); });

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'adeboye-secret-2026',
  resave: false, saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public/img')),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ success: false, error: 'Unauthorized' });
}
function mapPost(p) {
  return { ...p, id: p._id, created_at: p.createdAt, updated_at: p.updatedAt };
}

// ═══════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════
app.get('/api/posts', async (req, res) => {
  try {
    const filter = { published: true };
    if (req.query.category) filter.category = req.query.category;
    const limit = parseInt(req.query.limit) || 100;
    // Always sort newest first
    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, posts: posts.map(mapPost) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/posts/:slug', async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug, published: true },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!post) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, post: mapPost(post) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/posts/:slug/like', async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json({ success: true, likes: post ? post.likes : 0 });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/posts/:slug/share', async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { shares: 1 } },
      { new: true }
    );
    res.json({ success: true, shares: post ? post.shares : 0 });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Comments
app.get('/api/posts/:slug/comments', async (req, res) => {
  try {
    const comments = await Comment.find({
      post_slug: req.params.slug, approved: true, parent_id: null
    }).sort({ createdAt: -1 }).lean();
    const withReplies = await Promise.all(comments.map(async c => {
      const replies = await Comment.find({
        post_slug: req.params.slug, parent_id: c._id, approved: true
      }).sort({ createdAt: 1 }).lean();
      return { ...c, id: c._id, created_at: c.createdAt,
        replies: replies.map(r => ({ ...r, id: r._id, created_at: r.createdAt })) };
    }));
    res.json({ success: true, comments: withReplies });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/posts/:slug/comments', async (req, res) => {
  try {
    const { author_name, author_email, body, parent_id } = req.body;
    if (!author_name || !author_email || !body)
      return res.status(400).json({ success: false, error: 'Name, email and comment required' });
    const comment = await Comment.create({
      post_slug: req.params.slug, author_name, author_email, body,
      parent_id: parent_id || null,
    });
    res.json({ success: true, comment: { ...comment.toObject(), id: comment._id, created_at: comment.createdAt } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const c = await Comment.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    res.json({ success: true, likes: c ? c.likes : 0 });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });
    await Subscriber.findOneAndUpdate({ email }, { name, email }, { upsert: true, new: true });
    res.json({ success: true, message: 'Subscribed!' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    await Message.create({ name, email, subject, message });
    res.json({ success: true, message: 'Message received!' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Admin auth
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === (process.env.ADMIN_PASSWORD || 'adeboye2026')) {
    req.session.admin = true; res.json({ success: true });
  } else { res.status(401).json({ success: false, error: 'Wrong password' }); }
});
app.post('/api/admin/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get('/api/admin/check', (req, res) => { res.json({ loggedIn: !!(req.session && req.session.admin) }); });

// Admin posts
app.get('/api/admin/posts', requireAuth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, posts: posts.map(mapPost) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/posts', requireAuth, async (req, res) => {
  try {
    const { title, category, excerpt, content, image_url, is_new, read_time, published } = req.body;
    const slug = slugify(title, { lower: true, strict: true });
    const post = await Post.create({
      title, slug, category, excerpt, content,
      image_url: image_url || null,
      is_new: is_new === 'true' || is_new === true,
      read_time: read_time || '5 min read',
      published: published === 'true' || published === true
    });
    res.json({ success: true, post });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/admin/posts/:id', requireAuth, async (req, res) => {
  try {
    const { title, category, excerpt, content, image_url, is_new, read_time, published } = req.body;
    const slug = slugify(title, { lower: true, strict: true });
    const post = await Post.findByIdAndUpdate(req.params.id, {
      title, slug, category, excerpt, content,
      image_url: image_url || null,
      is_new: is_new === 'true' || is_new === true,
      read_time: read_time || '5 min read',
      published: published === 'true' || published === true
    }, { new: true });
    res.json({ success: true, post });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/admin/posts/:id', requireAuth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
  res.json({ success: true, url: '/img/' + req.file.filename });
});

app.get('/api/admin/subscribers', requireAuth, async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, subscribers });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/messages', requireAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, messages });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/comments', requireAuth, async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, comments });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/admin/comments/:id', requireAuth, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.listen(PORT, () => console.log(`🚀 The Adeboye Review on port ${PORT}`));
