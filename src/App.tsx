import React from "react";
import { ViewportManager } from "./lib/ui-framework/ViewportManager";
import { ScreenSystemExplorer } from "./components/desktop/ScreenSystemExplorer";
import { ScreenAIThoughts } from "./components/desktop/ScreenAIThoughts";
import { ScreenAppBuilder } from "./components/desktop/ScreenAppBuilder";
import { ScreenLegacyTests } from "./components/desktop/ScreenLegacyTests";

export default function App() {
  const screens = [
    { id: 'screen-1-sys', name: 'Системный Обозреватель', component: <ScreenSystemExplorer /> },
    { id: 'screen-2-ai', name: 'Нематериальные Данные (ИИ)', component: <ScreenAIThoughts /> },
    { id: 'screen-3-builder', name: 'Инженерный Пульт', component: <ScreenAppBuilder /> },
    { id: 'screen-4-tests', name: 'Тестовая Арена', component: <ScreenLegacyTests /> } // Wraps legacy tests!
  ];

  return <ViewportManager screens={screens} />;
}
