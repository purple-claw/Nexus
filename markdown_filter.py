import re
import markdown as md_lib


def render_reading_markdown(text):
    if not text:
        return ''
    mermaid_blocks = []

    def replace_mermaid(match):
        mermaid_blocks.append(match.group(1))
        return f'<!--MERMAID_{len(mermaid_blocks)-1}-->'

    text = re.sub(
        r'```mermaid\n(.*?)```',
        replace_mermaid,
        text,
        flags=re.DOTALL
    )

    html = md_lib.markdown(
        text,
        extensions=['fenced_code', 'tables']
    )

    for i, diagram in enumerate(mermaid_blocks):
        placeholder = f'<!--MERMAID_{i}-->'
        diagram_html = (
            '<div class="mermaid-wrapper my-6">'
            f'<div class="mermaid">\n{diagram.strip()}\n</div>'
            '</div>'
        )
        html = html.replace(placeholder, diagram_html)

    return html
