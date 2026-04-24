import { AnimatePresence, motion } from 'motion/react';
import {
  Copy,
  Filter,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Swords,
  Trash2,
  User,
  WandSparkles,
  Shield,
  Package,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type Category = '职业' | '怪物' | '武器' | '装备/道具' | '技能特效';

interface Asset {
  id: string;
  uid: string;
  name: string;
  version: string;
  category: Category;
  tags: string[];
  positivePrompt: string;
  negativePrompt: string;
  aiImage?: string;
  finalImage?: string;
}

const categories: { key: Category; icon: React.ReactNode }[] = [
  { key: '职业', icon: <User className="h-4 w-4" /> },
  { key: '怪物', icon: <Sparkles className="h-4 w-4" /> },
  { key: '武器', icon: <Swords className="h-4 w-4" /> },
  { key: '装备/道具', icon: <Shield className="h-4 w-4" /> },
  { key: '技能特效', icon: <WandSparkles className="h-4 w-4" /> },
];

const seeded: Asset[] = [
  {
    id: '1',
    uid: 'JOB-0001',
    name: '星界游侠',
    version: 'v0.9',
    category: '职业',
    tags: ['远程', '敏捷', '科幻'],
    positivePrompt: 'cyber ranger, slim armor, glowing visor, stylized game concept art',
    negativePrompt: 'lowres, blurry, deformed hands, photorealistic face',
    aiImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=900',
    finalImage: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=900',
  },
  {
    id: '2',
    uid: 'MON-0017',
    name: '深渊孢子兽',
    version: 'v1.2',
    category: '怪物',
    tags: ['异形', '毒性', '地下'],
    positivePrompt: 'fungus monster, bioluminescence, dark cave ambiance, painterly style',
    negativePrompt: 'cute, cartoon eyes, bright sunny background',
    aiImage: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=900',
    finalImage: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900',
  },
];

const emptyForm: Omit<Asset, 'id' | 'tags'> & { tags: string } = {
  uid: '',
  name: '',
  version: 'v1.0',
  category: '职业',
  tags: '',
  positivePrompt: '',
  negativePrompt: '',
  aiImage: undefined,
  finalImage: undefined,
};

export function App() {
  const [assets, setAssets] = useState<Asset[]>(seeded);
  const [activeCategory, setActiveCategory] = useState<Category>('职业');
  const [activeTag, setActiveTag] = useState<string>('全部');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(seeded[0]?.id ?? null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const allTags = useMemo(
    () => ['全部', ...new Set(assets.flatMap((a) => a.tags))],
    [assets],
  );

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      const inCategory = asset.category === activeCategory;
      const inTag = activeTag === '全部' || asset.tags.includes(activeTag);
      const keyword = search.trim().toLowerCase();
      const inSearch =
        keyword.length === 0 ||
        asset.name.toLowerCase().includes(keyword) ||
        asset.positivePrompt.toLowerCase().includes(keyword) ||
        asset.negativePrompt.toLowerCase().includes(keyword);
      return inCategory && inTag && inSearch;
    });
  }, [activeCategory, activeTag, assets, search]);

  const selected = assets.find((a) => a.id === selectedId) ?? filtered[0] ?? null;

  const upsertAsset = (event: FormEvent) => {
    event.preventDefault();
    if (!form.uid || !form.name) return;

    const payload: Asset = {
      id: editingId ?? crypto.randomUUID(),
      uid: form.uid,
      name: form.name,
      version: form.version,
      category: form.category,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      positivePrompt: form.positivePrompt,
      negativePrompt: form.negativePrompt,
      aiImage: form.aiImage,
      finalImage: form.finalImage,
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
    setForm({ ...asset, tags: asset.tags.join(', ') });
    setActiveCategory(asset.category);
  };

  const remove = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  const copyPrompt = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const handleImageFile = (field: 'aiImage' | 'finalImage', file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, [field]: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid h-full grid-cols-12 bg-slate-950 text-slate-100">
      <aside className="col-span-12 border-b border-slate-800 p-4 md:col-span-2 md:border-b-0 md:border-r">
        <h1 className="mb-4 text-lg font-semibold">漫剧资产库</h1>
        <nav className="space-y-2">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                activeCategory === c.key ? 'bg-indigo-500 text-white' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {c.icon}
              {c.key}
            </button>
          ))}
        </nav>
      </aside>

      <main className="col-span-12 grid grid-cols-12 md:col-span-10">
        <section className="col-span-12 border-b border-slate-800 p-4 xl:col-span-7 xl:border-b-0 xl:border-r">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-64 flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索名称或提示词..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs">
              <Filter className="h-3.5 w-3.5" /> 标签
            </span>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`rounded-md px-2 py-1 text-xs ${
                    activeTag === tag ? 'bg-emerald-500 text-black' : 'bg-slate-800'
                  }`}
                >
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
                  className={`group relative rounded-xl border p-3 transition ${
                    selected?.id === asset.id ? 'border-indigo-400 bg-slate-900' : 'border-slate-800 bg-slate-900/60'
                  }`}
                  onClick={() => setSelectedId(asset.id)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">{asset.name}</p>
                    <span className="text-xs text-slate-400">{asset.version}</span>
                  </div>
                  <p className="mb-2 text-xs text-slate-400">{asset.uid}</p>
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag) => (
                      <span key={tag} className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                    <button onClick={(e) => { e.stopPropagation(); edit(asset); }} className="rounded bg-slate-700 p-1">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); remove(asset.id); }} className="rounded bg-rose-700 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        <section className="col-span-12 p-4 xl:col-span-5">
          <form onSubmit={upsertAsset} className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              {editingId ? '编辑资产' : '新增资产'}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="名称" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="UID" value={form.uid} onChange={(e) => setForm((s) => ({ ...s, uid: e.target.value }))} />
              <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="版本号" value={form.version} onChange={(e) => setForm((s) => ({ ...s, version: e.target.value }))} />
              <select className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as Category }))}>
                {categories.map((c) => <option key={c.key}>{c.key}</option>)}
              </select>
            </div>
            <input className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="标签 (逗号分隔)" value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} />
            <textarea className="h-16 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs" placeholder="Positive Prompt" value={form.positivePrompt} onChange={(e) => setForm((s) => ({ ...s, positivePrompt: e.target.value }))} />
            <textarea className="h-16 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs" placeholder="Negative Prompt" value={form.negativePrompt} onChange={(e) => setForm((s) => ({ ...s, negativePrompt: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="rounded border border-dashed border-slate-600 p-2">上传 AI 原型图<input type="file" accept="image/*" className="mt-1 block w-full" onChange={(e) => handleImageFile('aiImage', e.target.files?.[0])} /></label>
              <label className="rounded border border-dashed border-slate-600 p-2">上传最终效果图<input type="file" accept="image/*" className="mt-1 block w-full" onChange={(e) => handleImageFile('finalImage', e.target.files?.[0])} /></label>
            </div>
            <button className="w-full rounded bg-indigo-500 px-3 py-2 text-sm font-medium">保存资产</button>
          </form>

          {selected ? (
            <motion.div layout className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">{selected.name}</h3>
                  <p className="text-xs text-slate-400">{selected.uid} · {selected.version}</p>
                </div>
                <span className="rounded bg-slate-800 px-2 py-1 text-xs">{selected.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ImagePanel title="AI Prototype" src={selected.aiImage} />
                <ImagePanel title="Final Render" src={selected.finalImage} />
              </div>
              <PromptCard title="Positive Prompt" value={selected.positivePrompt} onCopy={copyPrompt} />
              <PromptCard title="Negative Prompt" value={selected.negativePrompt} onCopy={copyPrompt} />
            </motion.div>
          ) : (
            <div className="rounded border border-dashed border-slate-700 p-4 text-sm text-slate-400">当前筛选无结果</div>
          )}
        </section>
      </main>
    </div>
  );
}

function ImagePanel({ title, src }: { title: string; src?: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-slate-400">{title}</p>
      {src ? (
        <img src={src} alt={title} className="h-32 w-full rounded-md object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-700 text-xs text-slate-500">
          <Package className="mr-1 h-4 w-4" /> 暂无图片
        </div>
      )}
    </div>
  );
}

function PromptCard({ title, value, onCopy }: { title: string; value: string; onCopy: (value: string) => void }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>{title}</span>
        <button className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1" onClick={() => onCopy(value)}>
          <Copy className="h-3.5 w-3.5" /> 一键复制
        </button>
      </div>
      <p className="text-xs text-slate-200">{value || '暂无内容'}</p>
    </div>
  );
}
