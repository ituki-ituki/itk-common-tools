POSES = {
    "": "",
    "glass": "A glass of this wine poured beside the bottle.",
    "low": "A low vertical angle looking up at the bottle, emphasizing its tall silhouette.",
    "close": "Even closer: the bottle's shoulder and label fill the frame.",
    "basket": "The bottle resting in a wicker pouring basket, wine being poured into a glass. Only a hand may appear.",
}

MODELS = ["gemini-3.1-flash-image", "gemini-3-pro-image"]

SCENE = """Photograph this exact wine bottle in a new square photo for a natural wine shop's social media.
Keep the bottle identical: same shape, glass color, capsule, and the label's design, colors and lettering. Do not invent new label text.

Read the shop's tag below and let its feeling decide the light, colors, surface and a few small props. Do not write any of the tag's words in the image.

The bottle is the hero: shoot close, the bottle fills about two thirds of the frame height, the background is soft and out of focus, and only a little of it shows.
Use a charming, playful angle, like a slight tilt or a cozy low viewpoint.
{pose}
Natural light, real photographic look, gentle film-like tone. No people unless stated above. No added text, logos or watermarks.

Shop's tag:
{note}"""
