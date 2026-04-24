import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  BookOpenText,
  Clapperboard,
  Copy,
  FolderOpen,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Swords,
  Trash2,
  User,
  WandSparkles,
  Shield,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type Category = '职业' | '怪物' | '武器' | '装备/道具' | '技能特效' | '镜头调度';
type ViewMode = 'assets' | 'story' | 'storyboard';

interface Asset {
  id: string;
  uid: string;
  name: string;
  category: Category;
  tags: string[];
  prompt?: string;
  image?: string;
  thumbnail?: string;
  sourcePath?: string;
}

interface StoryboardItem {
  id: string;
  title: string;
  prompt: string;
  video?: string;
}

const categories: { key: Category; icon: React.ReactNode }[] = [
  { key: '职业', icon: <User className="h-4 w-4" /> },
  { key: '怪物', icon: <Sparkles className="h-4 w-4" /> },
  { key: '武器', icon: <Swords className="h-4 w-4" /> },
  { key: '装备/道具', icon: <Shield className="h-4 w-4" /> },
  { key: '技能特效', icon: <WandSparkles className="h-4 w-4" /> },
  { key: '镜头调度', icon: <Clapperboard className="h-4 w-4" /> },
];

const seeded: Asset[] = [
  {
    id: '1',
    uid: 'AST-20260424-0001',
    name: '星界游侠',
    category: '职业',
    tags: ['远程', '敏捷', '科幻'],
    prompt: 'anime ranger, neon edge lighting, dynamic pose',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=900',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300',
  },
];

const seededBoards: StoryboardItem[] = [
  {
    id: 'b1',
    title: '通用分镜：英雄登场',
    prompt: 'wide shot, hero enters frame from shadow, slow dolly-in, backlight haze',
  },
];

const emptyForm = {
  name: '',
  tags: '',
  prompt: '',
  image: undefined as string | undefined,
  thumbnail: undefined as string | undefined,
  sourcePath: undefined as string | undefined,
};

const makeUid = (index: number) => {
  const date = new Date();
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `AST-${y}${m}${d}-${`${index}`.padStart(4, '0')}`;
};

async function createThumbnail(dataUrl: string, size = 240): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (size - w) / 2;
      const y = (size - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function tryOpenParentFolder(path?: string) {
  if (!path) {
    alert('当前浏览器拿不到本地文件路径，无法直接打开文件夹。可在桌面壳（如 Electron/Tauri）中启用此能力。');
    return;
  }
  const normalized = path.replace(/\\/g, '/');
  const folder = normalized.substring(0, normalized.lastIndexOf('/'));
  if (!folder) return alert('未解析到文件夹路径。');
  window.open(`file://${folder}`, '_blank');
}

export function App() {
  const [mode, setMode] = useState<ViewMode>('assets');
  const [assets, setAssets] = useState<Asset[]>(seeded);
  const [boards, setBoards] = useState<StoryboardItem[]>(seededBoards);
  const [activeCategory, setActiveCategory] = useState<Category>('职业');
  const [activeTag, setActiveTag] = useState<string>('全部');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(seeded[0]?.id ?? null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [storyTitle, setStoryTitle] = useState('第一章：破晓行动');
  const [storyText, setStoryText] = useState('在废墟都市中，主角小队准备潜入禁区夺回核心。');
  const [storyCastIds, setStoryCastIds] = useState<string[]>([]);

  const [boardForm, setBoardForm] = useState({ title: '', prompt: '', video: undefined as string | undefined });

  const allTags = useMemo(() => ['全部', ...new Set(assets.flatMap((a) => a.tags))], [assets]);

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      const inCategory = asset.category === activeCategory;
      const inTag = activeTag === '全部' || asset.tags.includes(activeTag);
      const keyword = search.trim().toLowerCase();
      const inSearch =
        keyword.length === 0 ||
        asset.name.toLowerCase().includes(keyword) ||
        asset.tags.join(' ').toLowerCase().includes(keyword) ||
        (asset.prompt ?? '').toLowerCase().includes(keyword);
      return inCategory && inTag && inSearch;
    });
  }, [activeCategory, activeTag, assets, search]);

  const selected = assets.find((a) => a.id === selectedId) ?? filtered[0] ?? null;
  const castPool = assets.filter((a) => a.category === '职业');
  const storyCast = storyCastIds
    .map((id) => assets.find((a) => a.id === id))
    .filter((a): a is Asset => Boolean(a));

  const copyText = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  const upsertAsset = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.image) return;

    const payload: Asset = {
      id: editingId ?? crypto.randomUUID(),
      uid: editingId ? assets.find((a) => a.id === editingId)?.uid ?? makeUid(assets.length + 1) : makeUid(assets.length + 1),
      name: form.name,
      category: activeCategory,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      prompt: form.prompt.trim() || undefined,
      image: form.image,
      thumbnail: form.thumbnail ?? form.image,
      sourcePath: form.sourcePath,
    };

    setAssets((prev) => {
      const index = prev.findIndex((a) => a.id === payload.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = payload;
        return next;
      }
      return [payload, ...prev];
    });

    setSelectedId(payload.id);
    setEditingId(null);
    setForm(emptyForm);
  };

  const edit = (asset: Asset) => {
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      tags: asset.tags.join(', '),
      prompt: asset.prompt ?? '',
      image: asset.image,
      thumbnail: asset.thumbnail,
      sourcePath: asset.sourcePath,
    });
    setActiveCategory(asset.category);
  };

  const remove = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setStoryCastIds((prev) => prev.filter((x) => x !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  const handleImageFile = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const image = String(reader.result);
      const thumbnail = await createThumbnail(image);
      setForm((prev) => ({
        ...prev,
        image,
        thumbnail,
        sourcePath: (file as File & { path?: string }).path,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBoardVideo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBoardForm((prev) => ({ ...prev, video: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const createBoard = (e: FormEvent) => {
    e.preventDefault();
    if (!boardForm.title || !boardForm.prompt) return;
    setBoards((prev) => [{ id: crypto.randomUUID(), ...boardForm }, ...prev]);
    setBoardForm({ title: '', prompt: '', video: undefined });
  };

  const moveCast = (index: number, dir: -1 | 1) => {
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= storyCastIds.length) return;
    const next = [...storyCastIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setStoryCastIds(next);
  };

  const addCast = (id: string) => {
    setStoryCastIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div className="grid h-full grid-cols-12 bg-slate-950 text-slate-100">
      <aside className="col-span-12 border-b border-slate-800 p-4 md:col-span-2 md:border-b-0 md:border-r">
        <h1 className="mb-4 text-lg font-semibold">漫剧资产库</h1>

        <div className="mb-4 grid grid-cols-1 gap-2 text-xs">
          <button onClick={() => setMode('assets')} className={`rounded px-2 py-1.5 ${mode === 'assets' ? 'bg-indigo-500 text-white' : 'bg-slate-900'}`}>资产管理</button>
          <button onClick={() => setMode('story')} className={`rounded px-2 py-1.5 ${mode === 'story' ? 'bg-indigo-500 text-white' : 'bg-slate-900'}`}>故事大纲</button>
          <button onClick={() => setMode('storyboard')} className={`rounded px-2 py-1.5 ${mode === 'storyboard' ? 'bg-indigo-500 text-white' : 'bg-slate-900'}`}>通用分镜</button>
        </div>

        {mode === 'assets' && (
          <nav className="space-y-2">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${activeCategory === c.key ? 'bg-indigo-500 text-white' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                {c.icon}
                {c.key}
              </button>
            ))}
          </nav>
        )}
      </aside>

      <main className="col-span-12 md:col-span-10">
        {mode === 'assets' && (
          <div className="grid grid-cols-12">
            <section className="col-span-12 border-b border-slate-800 p-4 xl:col-span-7 xl:border-b-0 xl:border-r">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-64 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索名称/标签/提示词..." className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button key={tag} onClick={() => setActiveTag(tag)} className={`rounded-md px-2 py-1 text-xs ${activeTag === tag ? 'bg-emerald-500 text-black' : 'bg-slate-800'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filtered.map((asset) => (
                    <motion.article
                      key={asset.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className={`group relative rounded-xl border p-3 transition ${selected?.id === asset.id ? 'border-indigo-400 bg-slate-900' : 'border-slate-800 bg-slate-900/60'}`}
                      onClick={() => setSelectedId(asset.id)}
                    >
                      <img src={asset.thumbnail ?? asset.image} alt={asset.name} className="mb-2 h-24 w-full rounded object-cover" />
                      <p className="truncate text-sm font-semibold">{asset.name}</p>
                      <p className="mb-2 truncate text-[11px] text-slate-400">{asset.uid}</p>
                      <div className="mb-2 flex flex-wrap gap-1">
                        {asset.tags.map((tag) => <span key={tag} className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">{tag}</span>)}
                      </div>
                      {asset.prompt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void copyText(asset.prompt ?? '');
                          }}
                          className="rounded bg-emerald-700 px-2 py-1 text-xs"
                        >
                          复制提示词
                        </button>
                      )}
                      <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                        <button onClick={(e) => { e.stopPropagation(); edit(asset); }} className="rounded bg-slate-700 p-1"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); remove(asset.id); }} className="rounded bg-rose-700 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>

            <section className="col-span-12 p-4 xl:col-span-5">
              <form onSubmit={upsertAsset} className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4" />{editingId ? '编辑资产' : `新增资产（分类：${activeCategory}）`}</h2>
                <input className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="名称（必填）" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
                <input className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="标签（可选，逗号分隔）" value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} />
                <textarea className="h-16 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs" placeholder="提示词（选填）" value={form.prompt} onChange={(e) => setForm((s) => ({ ...s, prompt: e.target.value }))} />
                <label className="block rounded border border-dashed border-slate-600 p-2 text-xs">上传图片（必填）
                  <input type="file" accept="image/*" className="mt-1 block w-full" onChange={(e) => void handleImageFile(e.target.files?.[0])} />
                </label>
                <p className="text-xs text-slate-400">UID 自动生成；版本号已移除。手动输入仅需名称、标签、图片，提示词为选填。</p>
                <button className="w-full rounded bg-indigo-500 px-3 py-2 text-sm font-medium">保存资产</button>
              </form>

              {selected ? (
                <motion.div layout className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div>
                    <h3 className="text-base font-semibold">{selected.name}</h3>
                    <p className="text-xs text-slate-400">{selected.uid} · {selected.category}</p>
                  </div>
                  {selected.image ? (
                    <button className="group relative block w-full" onClick={() => tryOpenParentFolder(selected.sourcePath)} title="点击尝试打开图片所在文件夹">
                      <img src={selected.image} alt={selected.name} className="h-56 w-full rounded-md object-cover" />
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs"><FolderOpen className="h-3.5 w-3.5" /> 打开所在文件夹</span>
                    </button>
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-slate-700 text-xs text-slate-500"><ImageIcon className="mr-1 h-4 w-4" />暂无图片</div>
                  )}
                  {selected.prompt && (
                    <button className="inline-flex w-fit items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-xs" onClick={() => void copyText(selected.prompt ?? '')}><Copy className="h-3.5 w-3.5" />复制提示词</button>
                  )}
                  {selected.thumbnail && (
                    <div>
                      <p className="mb-1 text-xs text-slate-400">自动生成缩略图</p>
                      <img src={selected.thumbnail} alt={`${selected.name} thumbnail`} className="h-24 w-24 rounded object-cover" />
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="rounded border border-dashed border-slate-700 p-4 text-sm text-slate-400">当前筛选无结果</div>
              )}
            </section>
          </div>
        )}

        {mode === 'story' && (
          <section className="grid gap-4 p-4 xl:grid-cols-12">
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 xl:col-span-8">
              <h2 className="flex items-center gap-2 text-base font-semibold"><BookOpenText className="h-4 w-4" />故事大纲（头脑风暴）</h2>
              <input className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="故事标题" />
              <textarea className="h-48 w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" value={storyText} onChange={(e) => setStoryText(e.target.value)} placeholder="写下剧情主线、冲突、转折..." />
              <div>
                <p className="mb-2 text-xs text-slate-400">已加入角色（可上下调整顺序）</p>
                <div className="space-y-2">
                  {storyCast.length === 0 && <p className="text-xs text-slate-500">还没有加入角色</p>}
                  {storyCast.map((asset, i) => (
                    <div key={asset.id} className="flex items-center justify-between rounded bg-slate-900 px-2 py-1 text-sm">
                      <span>{i + 1}. {asset.name}</span>
                      <div className="flex gap-1">
                        <button className="rounded bg-slate-700 p-1" onClick={() => moveCast(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button className="rounded bg-slate-700 p-1" onClick={() => moveCast(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                        <button className="rounded bg-rose-700 px-2 text-xs" onClick={() => setStoryCastIds((prev) => prev.filter((id) => id !== asset.id))}>移除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 xl:col-span-4">
              <h3 className="mb-2 text-sm font-semibold">从资产库拉取角色</h3>
              <div className="space-y-2">
                {castPool.map((asset) => (
                  <button key={asset.id} onClick={() => addCast(asset.id)} className="flex w-full items-center justify-between rounded bg-slate-900 px-2 py-2 text-sm">
                    <span className="truncate">{asset.name}</span>
                    <span className="rounded bg-indigo-500 px-1.5 py-0.5 text-[10px]">加入大纲</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {mode === 'storyboard' && (
          <section className="grid gap-4 p-4 xl:grid-cols-12">
            <form onSubmit={createBoard} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3 xl:col-span-4">
              <h2 className="flex items-center gap-2 text-base font-semibold"><Clapperboard className="h-4 w-4" />通用分镜模块</h2>
              <input className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="分镜标题" value={boardForm.title} onChange={(e) => setBoardForm((s) => ({ ...s, title: e.target.value }))} />
              <textarea className="h-28 w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="分镜文字提示词" value={boardForm.prompt} onChange={(e) => setBoardForm((s) => ({ ...s, prompt: e.target.value }))} />
              <label className="block rounded border border-dashed border-slate-600 p-2 text-xs">上传预览视频（可选）
                <input type="file" accept="video/*" className="mt-1 block w-full" onChange={(e) => handleBoardVideo(e.target.files?.[0])} />
              </label>
              <button className="w-full rounded bg-indigo-500 px-3 py-2 text-sm">新增分镜条目</button>
            </form>

            <div className="space-y-3 xl:col-span-8">
              {boards.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <div className="flex gap-2">
                      <button className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-xs" onClick={() => void copyText(item.prompt)}><Copy className="h-3.5 w-3.5" />复制提示词</button>
                      <button className="rounded bg-rose-700 px-2 py-1 text-xs" onClick={() => setBoards((prev) => prev.filter((x) => x.id !== item.id))}>删除</button>
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-slate-300">{item.prompt}</p>
                  {item.video && <video src={item.video} controls className="max-h-64 w-full rounded" />}
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
