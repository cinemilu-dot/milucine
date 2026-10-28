from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.webbrowser import open as abrir_navegador

class TelaCategorias(Screen):
    def __init__(self, **kwargs):
        super(TelaCategorias, self).__init__(**kwargs)
        layout = BoxLayout(orientation='vertical', padding=20, spacing=15)
        
        layout.add_widget(Label(text="🎬 MiluCine", font_size=28, color=(0.22, 0.74, 0.97, 1), size_hint_y=None, height=50))
        
        categorias = [
            ("🍿 Filmes", "filmes"),
            ("📺 Séries", "series"),
            ("⚽ Esportes ao vivo", "esportes"),
            ("🎭 Dorama", "dorama"),
            ("⚔️ Anime", "anime"),
            ("🔒 Conteúdo adulto", "adulto")
        ]
        
        for nome, cat_id in categorias:
            btn = Button(text=nome, font_size=18, background_color=(0.12, 0.16, 0.24, 1))
            btn.bind(on_press=lambda instance, cid=cat_id: self.ir_para_canais(cid))
            layout.add_widget(btn)
            
        self.add_widget(layout)

    def ir_para_canais(self, categoria):
        self.manager.categoria_atual = categoria
        self.manager.current = 'canais'

class TelaCanais(Screen):
    def on_enter(self):
        self.clear_widgets()
        layout = BoxLayout(orientation='vertical', padding=20, spacing=15)
        
        cat = getattr(self.manager, 'categoria_atual', 'filmes')
        layout.add_widget(Label(text=f"Canais - {cat.upper()}", font_size=22, color=(0.22, 0.74, 0.97, 1), size_hint_y=None, height=40))
        
        # Links de exemplo configurados diretamente para abrir sem bloqueios no app nativo
        links = [
            ("Canal 01 (PobreFlix)", "https://www.pobreflix.sale"),
            ("Canal 02 (RedeCanais)", "https://redecanais4k.my"),
            ("Canal 03 (StreamBetter)", "https://streambetter.lol")
        ]
        
        for nome, url in links:
            btn = Button(text=nome, font_size=16, background_color=(0.11, 0.23, 0.54, 1))
            btn.bind(on_press=lambda instance, u=url: abrir_navegador(u))
            layout.add_widget(btn)
            
        btn_voltar = Button(text="< Voltar", font_size=16, background_color=(0.2, 0.2, 0.2, 1), size_hint_y=None, height=50)
        btn_voltar.bind(on_press=lambda x: setattr(self.manager, 'current', 'categorias'))
        layout.add_widget(btn_voltar)
        
        self.add_widget(layout)

class MiluCineApp(App):
    def build(self):
        sm = ScreenManager()
        sm.add_widget(TelaCategorias(name='categorias'))
        sm.add_widget(TelaCanais(name='canais'))
        return sm

if __name__ == '__main__':
    MiluCineApp().run()
