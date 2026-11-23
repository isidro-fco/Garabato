import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { EditorSelection, EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@/lib/utils'
import { vistaEnVivo } from '../utils/vistaEnVivo.js'

// Ctrl/Cmd + B o I: envuelve la selección (o la palabra vacía) con la marca.
function envolver(marcaTexto) {
  return (view) => {
    view.dispatch(view.state.changeByRange((r) => {
      const texto = view.state.sliceDoc(r.from, r.to)
      const yaTiene = texto.startsWith(marcaTexto) && texto.endsWith(marcaTexto) && texto.length >= marcaTexto.length * 2
      if (yaTiene) {
        const interior = texto.slice(marcaTexto.length, -marcaTexto.length)
        return { changes: { from: r.from, to: r.to, insert: interior }, range: EditorSelection.range(r.from, r.from + interior.length) }
      }
      return {
        changes: [{ from: r.from, insert: marcaTexto }, { from: r.to, insert: marcaTexto }],
        range: r.empty
          ? EditorSelection.cursor(r.from + marcaTexto.length)
          : EditorSelection.range(r.from + marcaTexto.length, r.to + marcaTexto.length),
      }
    }))
    return true
  }
}

// El texto ocupa el área de la hoja (Escritorio.jsx pone las variables --hoja-*
// y --doc-*): mismos márgenes, letra e interlineado que el PDF. El editor crece
// con el texto; el que hace scroll es el escritorio.
const tema = EditorView.theme({
  '&': { height: 'auto', backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--doc-fuente)', lineHeight: 'var(--doc-interlineado)', overflow: 'visible' },
  '.cm-content': {
    boxSizing: 'border-box',
    minHeight: 'var(--hoja-alto)',
    padding: 'var(--hoja-margen)',
    fontSize: 'var(--hoja-letra)',
    caretColor: 'var(--foreground)',
  },
  '.cm-line': { padding: '0' },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-placeholder': { color: 'var(--muted-foreground)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in oklch, var(--ring) 35%, transparent)' },
})

// Editor de Markdown con vista en vivo (ver utils/vistaEnVivo.js).
// valorInicial: el texto al montar; después el editor es la fuente de verdad.
// onCambiar(texto) se llama en cada cambio. ref expone insertar(texto) y enfocar().
export default function EditorMarkdown({ valorInicial, onCambiar, ref, className, id, etiqueta }) {
  const contenedor = useRef(null)
  const vista = useRef(null)
  const alCambiar = useRef(onCambiar)
  useEffect(() => {
    alCambiar.current = onCambiar
  })

  useEffect(() => {
    const view = new EditorView({
      parent: contenedor.current,
      state: EditorState.create({
        doc: valorInicial,
        extensions: [
          history(),
          keymap.of([
            { key: 'Mod-b', run: envolver('**') },
            { key: 'Mod-i', run: envolver('*') },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          // Incluye las extensiones de GitHub (tablas, tachado, tareas) y
          // Enter que continúa listas y citas.
          markdown({ base: markdownLanguage }),
          EditorView.lineWrapping,
          placeholder('Empieza a escribir… Usa # para títulos, **negrita**, *cursiva* y - para listas.'),
          EditorView.contentAttributes.of({ id, 'aria-label': etiqueta, spellcheck: 'true', autocapitalize: 'sentences', lang: 'es' }),
          tema,
          vistaEnVivo,
          EditorView.updateListener.of((u) => {
            if (u.docChanged) alCambiar.current?.(u.state.doc.toString())
          }),
        ],
      }),
    })
    vista.current = view
    return () => view.destroy()
    // Solo al montar: después el texto vive dentro de CodeMirror.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    // Inserta texto donde está el cursor (o reemplaza la selección), con espacios
    // para que no quede pegado a las palabras, y deja el cursor después.
    insertar(texto) {
      const view = vista.current
      if (!view) return
      const { from, to } = view.state.selection.main
      const antes = view.state.sliceDoc(Math.max(0, from - 1), from)
      const despues = view.state.sliceDoc(to, to + 1)
      const insertado = (antes && !/\s/.test(antes) ? ' ' : '') + texto + (/[\p{L}\p{N}]/u.test(despues) ? ' ' : '')
      view.dispatch({ changes: { from, to, insert: insertado }, selection: { anchor: from + insertado.length }, scrollIntoView: true })
      view.focus()
    },
    enfocar: () => vista.current?.focus(),
    // Cursor al final del texto (clic en la parte vacía de la hoja).
    enfocarAlFinal() {
      const view = vista.current
      if (!view) return
      view.dispatch({ selection: { anchor: view.state.doc.length }, scrollIntoView: true })
      view.focus()
    },
  }), [])

  return <div ref={contenedor} className={cn('editor-vivo', className)} />
}
