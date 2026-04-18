from PIL import Image

img = Image.open("128.png")
img.resize((16, 16), Image.Resampling.LANCZOS).save("16.png")
print("Created 16.png")
