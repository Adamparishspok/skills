import re, math, sys
def srgb2lin(c):
    c/=255; return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def lin2srgb(c):
    c=max(0,min(1,c)); return 255*(12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055)
def hex2oklab(h):
    h=h.lstrip('#'); r,g,b=[srgb2lin(int(h[i:i+2],16)) for i in (0,2,4)]
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b; m=0.2119034982*r+0.6806995451*g+0.1073969566*b; s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=[x**(1/3) for x in (l,m,s)]
    return (0.2104542553*l+0.7936177850*m-0.0040720468*s, 1.9779984951*l-2.4285922050*m+0.4505937099*s, 0.0259040371*l+0.7827717662*m-0.8086757660*s)
def oklab2hex(L,a,b):
    l=(L+0.3963377774*a+0.2158037573*b)**3; m=(L-0.1055613458*a-0.0638541728*b)**3; s=(L-0.0894841775*a-1.2914855480*b)**3
    r=4.0767416621*l-3.3077115913*m+0.2309699292*s; g=-1.2684380046*l+2.6097574011*m-0.3413193965*s; bb=-0.0041960863*l-0.7034186147*m+1.7076147010*s
    return '#%02x%02x%02x'%tuple(round(lin2srgb(x)) for x in (r,g,bb))
def oklch(h):
    L,a,b=hex2oklab(h); C=math.hypot(a,b); H=math.degrees(math.atan2(b,a))%360; return L,C,H
def lch2hex(L,C,H): return oklab2hex(L,C*math.cos(math.radians(H)),C*math.sin(math.radians(H)))
def dE(h1,h2): return 100*math.dist(hex2oklab(h1),hex2oklab(h2))
def lum(h):
    h=h.lstrip('#'); r,g,b=[srgb2lin(int(h[i:i+2],16)) for i in (0,2,4)]; return 0.2126*r+0.7152*g+0.0722*b
def contrast(a,b):
    x,y=sorted([lum(a),lum(b)]); return (y+0.05)/(x+0.05)
