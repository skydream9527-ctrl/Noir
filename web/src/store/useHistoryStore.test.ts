import { beforeEach, describe, expect, it } from "vitest";
import { useHistoryStore } from "@/store/useHistoryStore";

describe("useHistoryStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useHistoryStore.setState({ items: [] });
  });

  it("record 新增记录并置顶", () => {
    useHistoryStore.getState().record({ title: "页面A", url: "https://a.com" });
    const items = useHistoryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: "页面A", url: "https://a.com" });
    expect(items[0].id).toBeTruthy();
    expect(items[0].visitedAt).toBeGreaterThan(0);
  });

  it("相同 URL 去重，新记录置顶", () => {
    useHistoryStore.getState().record({ title: "页面A", url: "https://a.com" });
    useHistoryStore.getState().record({ title: "页面B", url: "https://b.com" });
    useHistoryStore.getState().record({ title: "页面A更新", url: "https://a.com" });
    const items = useHistoryStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("页面A更新");
    expect(items[0].url).toBe("https://a.com");
  });

  it("超过上限 200 条时截断", () => {
    for (let i = 0; i < 210; i++) {
      useHistoryStore.getState().record({
        title: `页面${i}`,
        url: `https://x${i}.com`,
      });
    }
    expect(useHistoryStore.getState().items).toHaveLength(200);
    // 最新记录在顶部
    expect(useHistoryStore.getState().items[0].url).toBe("https://x209.com");
  });

  it("remove 按 id 移除单条", () => {
    useHistoryStore.getState().record({ title: "A", url: "https://a.com" });
    useHistoryStore.getState().record({ title: "B", url: "https://b.com" });
    const idToRemove = useHistoryStore.getState().items[0].id;
    useHistoryStore.getState().remove(idToRemove);
    const items = useHistoryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items.find((i) => i.id === idToRemove)).toBeUndefined();
  });

  it("clear 清空所有记录", () => {
    useHistoryStore.getState().record({ title: "A", url: "https://a.com" });
    useHistoryStore.getState().clear();
    expect(useHistoryStore.getState().items).toEqual([]);
  });

  it("持久化到 localStorage", () => {
    useHistoryStore.getState().record({ title: "页面A", url: "https://a.com" });
    const raw = localStorage.getItem("noir_history");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.items).toHaveLength(1);
  });
});
