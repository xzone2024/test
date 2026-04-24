import { AnimatePresence, motion } from 'motion/react';
import {
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

type Category = '职业' | '怪物' | '武器' | '装备/道具' | '技能特效';

interface Asset {
  id: string;
  uid: string;
  name: string;
  category: Category;
  tags: string[];
  image?: string;
  thumbnail?: string;
  sourcePath?: string;
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
    uid: 'AST-20260424-0001',
    name: '星界游侠',
    category: '职业',
    tags: ['远程', '敏捷', '科幻'],
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=900',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300',
  },
];

const emptyForm = {
  name: '',
  tags: '',
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
  if (!folder) {
    alert('未解析到文件夹路径。');
    return;
  }
  window.open(`file://${folder}`, '_blank');
}

export function App() {
  const [assets, setAssets] = useState<Asset[]>(seeded);
  const [activeCategory, setActiveCategory] = useState<Category>('职业');
  const [activeTag, setActiveTag] = useState<string>('全部');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(seeded[0]?.id ?? null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const allTags = useMemo(() => ['全部', ...new Set(assets.flatMap((a) => a.tags))], [assets]);

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      const inCategory = asset.category === activeCategory;
      const inTag = activeTag === '全部' || asset.tags.includes(activeTag);
      const keyword = search.trim().toLowerCase();
      const inSearch = keyword.length === 0 || asset.name.toLowerCase().includes(keyword) || asset.tags.join(' ').toLowerCase().includes(keyword);
      return inCategory && inTag && inSearch;
    });
  }, [activeCategory, activeTag, assets, search]);

  const selected = assets.find((a) => a.id === selectedId) ?? filtered[0] ?? null;

  const upsertAsset = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.image) return;

    const payload: Asset = {
      id: editingId ?? crypto.randomUUID(),
      uid: editingId ? assets.find((a) => a.id === editingId)?.uid ?? makeUid(assets.length + 1) : makeUid(assets.length + 1),
      name: form.name,
      category: activeCategory,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
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
      image: asset.image,
      thumbnail: asset.thumbnail,
      sourcePath: asset.sourcePath,
    });
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
                placeholder="搜索名称或标签..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`rounded-md px-2 py-1 text-xs ${activeTag === tag ? 'bg-emerald-500 text-black' : 'bg-slate-800'}`}
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
                  className={`group relative rounded-xl border p-3 transition ${selected?.id === asset.id ? 'border-indigo-400 bg-slate-900' : 'border-slate-800 bg-slate-900/60'}`}
                  onClick={() => setSelectedId(asset.id)}
                >
                  <img src={asset.thumbnail ?? asset.image} alt={asset.name} className="mb-2 h-24 w-full rounded object-cover" />
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{asset.name}</p>
                  </div>
                  <p className="mb-2 truncate text-[11px] text-slate-400">{asset.uid}</p>
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag) => (
                      <span key={tag} className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">{tag}</span>
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
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4" />{editingId ? '编辑资产' : `新增资产（分类：${activeCategory}）`}</h2>
            <input className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="名称（必填）" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="标签（可选，逗号分隔）" value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} />
            <label className="block rounded border border-dashed border-slate-600 p-2 text-xs">上传图片（必填）
              <input type="file" accept="image/*" className="mt-1 block w-full" onChange={(e) => void handleImageFile(e.target.files?.[0])} />
            </label>
            <p className="text-xs text-slate-400">UID 自动生成；版本号已移除。你只需输入名称、标签并上传图片。</p>
            <button className="w-full rounded bg-indigo-500 px-3 py-2 text-sm font-medium">保存资产</button>
          </form>

          {selected ? (
            <motion.div layout className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div>
                <h3 className="text-base font-semibold">{selected.name}</h3>
                <p className="text-xs text-slate-400">{selected.uid} · {selected.category}</p>
              </div>
              {selected.image ? (
                <button
                  className="group relative block w-full"
                  onClick={() => tryOpenParentFolder(selected.sourcePath)}
                  title="点击尝试打开图片所在文件夹"
                >
                  <img src={selected.image} alt={selected.name} className="h-56 w-full rounded-md object-cover" />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs">
                    <FolderOpen className="h-3.5 w-3.5" /> 打开所在文件夹
                  </span>
                </button>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-slate-700 text-xs text-slate-500"><ImageIcon className="mr-1 h-4 w-4" />暂无图片</div>
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
      </main>
    </div>
  );
}
