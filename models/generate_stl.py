#!/usr/bin/env python3
"""Generate a real binary STL of the 'Top tube assembly' part (units: mm)."""
import math, struct

tris = []  # each: (v0, v1, v2)

def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def add(a, b): return (a[0]+b[0], a[1]+b[1], a[2]+b[2])
def scale(a, s): return (a[0]*s, a[1]*s, a[2]*s)
def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def norm(a):
    m = math.sqrt(a[0]**2 + a[1]**2 + a[2]**2) or 1.0
    return (a[0]/m, a[1]/m, a[2]/m)

def cylinder(p0, p1, r, seg=56, caps=True):
    """Tessellated cylinder between two world-space points."""
    axis = norm(sub(p1, p0))
    # pick a vector not parallel to axis
    ref = (0, 0, 1) if abs(axis[2]) < 0.9 else (0, 1, 0)
    u = norm(cross(axis, ref))
    v = cross(axis, u)
    ring0, ring1 = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        off = add(scale(u, r * math.cos(a)), scale(v, r * math.sin(a)))
        ring0.append(add(p0, off))
        ring1.append(add(p1, off))
    for i in range(seg):
        j = (i + 1) % seg
        tris.append((ring0[i], ring0[j], ring1[j]))
        tris.append((ring0[i], ring1[j], ring1[i]))
    if caps:
        for i in range(seg):
            j = (i + 1) % seg
            tris.append((p0, ring0[j], ring0[i]))
            tris.append((p1, ring1[i], ring1[j]))

# --- Part definition (mm) ---
# main tube
cylinder((-34, 0, 0), (34, 0, 0), 10)
# end collars
cylinder((-40, 0, 0), (-28, 0, 0), 15)
cylinder((28, 0, 0), (40, 0, 0), 15)
# branch tube (the joint that makes it an "assembly") rising up-right
cylinder((34, 6, 0), (60, 40, 0), 8)
# branch collar near the top of the branch
bax = norm((60 - 34, 40 - 6, 0))
btop = (58, 38, 0)
cylinder(sub(btop, scale(bax, 6)), add(btop, scale(bax, 6)), 11)
# two bolt bosses on the left collar
cylinder((-34, 8, -7), (-34, 20, -7), 2.6)
cylinder((-34, 8, 7), (-34, 20, 7), 2.6)

# --- Write binary STL ---
out = "/Users/david_anyaeche/Chrous AI/chorus-prototype/models/top-tube-assembly.stl"
with open(out, "wb") as f:
    f.write(b"ALSO top-tube-assembly TM-4-1001 Rev3".ljust(80, b" "))
    f.write(struct.pack("<I", len(tris)))
    for (a, b, c) in tris:
        n = norm(cross(sub(b, a), sub(c, a)))
        f.write(struct.pack("<12fH", *n, *a, *b, *c, 0))

print(f"Wrote {len(tris)} triangles -> {out}")
