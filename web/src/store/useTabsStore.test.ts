import { beforeEach, describe, expect, it } from "vitest";
import { useTabsStore } from "@/store/useTabsStore";

describe("useTabsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useTabsStore.setState({ tabs: [], activeId: null });
  });

  it("createTab 添加标签并设为活跃", () => {
    const id = useTabsStore.getState().createTab("https://example.com", "示例");
    const { tabs, activeId } = useTabsStore.getState();
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toMatchObject({
      id,
      url: "https://example.com",
      title: "示例",
    });
    expect(activeId).toBe(id);
  });

  it("createTab 无标题时从 URL 推导", () => {
    const id = useTabsStore.getState().createTab("https://www.example.com");
    expect(useTabsStore.getState().tabs[0].title).toBe("example.com");
    expect(id).toBeTruthy();
  });

  it("closeTab 移除标签并切换活跃到相邻标签", () => {
    const id1 = useTabsStore.getState().createTab("https://a.com", "A");
    const id2 = useTabsStore.getState().createTab("https://b.com", "B");
    const id3 = useTabsStore.getState().createTab("https://c.com", "C");
    expect(useTabsStore.getState().activeId).toBe(id3);

    useTabsStore.getState().closeTab(id3);
    expect(useTabsStore.getState().activeId).toBe(id2);

    useTabsStore.getState().closeTab(id2);
    expect(useTabsStore.getState().activeId).toBe(id1);

    useTabsStore.getState().closeTab(id1);
    expect(useTabsStore.getState().tabs).toEqual([]);
    expect(useTabsStore.getState().activeId).toBeNull();
  });

  it("setActive 切换活跃标签", () => {
    const id1 = useTabsStore.getState().createTab("https://a.com", "A");
    const id2 = useTabsStore.getState().createTab("https://b.com", "B");
    useTabsStore.getState().setActive(id1);
    expect(useTabsStore.getState().activeId).toBe(id1);
    useTabsStore.getState().setActive(id2);
    expect(useTabsStore.getState().activeId).toBe(id2);
  });

  it("updateTab 部分更新标签字段", () => {
    const id = useTabsStore.getState().createTab("https://a.com", "A");
    useTabsStore.getState().updateTab(id, { title: "更新后", url: "https://b.com" });
    const tab = useTabsStore.getState().tabs.find((t) => t.id === id);
    expect(tab?.title).toBe("更新后");
    expect(tab?.url).toBe("https://b.com");
  });

  it("closeAll 清空所有标签", () => {
    useTabsStore.getState().createTab("https://a.com", "A");
    useTabsStore.getState().createTab("https://b.com", "B");
    useTabsStore.getState().closeAll();
    expect(useTabsStore.getState().tabs).toEqual([]);
    expect(useTabsStore.getState().activeId).toBeNull();
  });

  it("持久化到 localStorage", () => {
    useTabsStore.getState().createTab("https://example.com", "示例");
    const raw = localStorage.getItem("noir_tabs");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.tabs).toHaveLength(1);
    expect(parsed.state.tabs[0].url).toBe("https://example.com");
  });
});
