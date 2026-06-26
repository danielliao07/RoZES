
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from discopy.symmetric import Ty, Box, Diagram

egg, white, yolk = Ty("egg"), Ty("white"), Ty("yolk")
crack = Box("crack", egg, white @ yolk)
merge = lambda X: Box("merge", X @ X, X)

@Diagram.from_callable(egg @ egg, white @ yolk)
def crack_two_eggs(x, y):
    (a, b), (c, d) = crack(x), crack(y)
    return (merge(white)(a, c), merge(yolk)(b, d))

script_dir = os.path.dirname(os.path.abspath(__file__))
crack_two_eggs.draw(path=os.path.join(script_dir, "testdiagram.svg"))
print("done")