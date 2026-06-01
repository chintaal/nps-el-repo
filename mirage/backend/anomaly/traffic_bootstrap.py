import numpy as np


def generate_baseline(n_samples: int = 2000, seed: int = 42) -> np.ndarray:
    """Generate synthetic clean traffic feature vectors for IF training.

    Feature vector: [cl_zscore, param_density, entropy]

    Realistic distribution:
    - 55% GET requests: empty body (entropy=0), sparse params, low cl_zscore
    - 45% POST/PUT requests: form/JSON body (entropy~3.5), moderate cl_zscore
    """
    rng = np.random.default_rng(seed)

    n_get = int(n_samples * 0.55)
    n_post = n_samples - n_get

    # GET requests: no body → entropy=0, very sparse params, stable content lengths
    get_cl_zscores = rng.normal(0.0, 0.3, n_get).clip(0, 2)
    get_param_density = rng.beta(1.2, 12.0, n_get)       # very sparse params
    get_entropy = np.zeros(n_get)                          # empty body

    # POST/form requests: body with natural text entropy
    post_cl_zscores = rng.normal(0.0, 0.5, n_post).clip(0, 2)
    post_param_density = rng.beta(1.5, 8.0, n_post)       # moderate params
    post_entropy = rng.normal(3.5, 0.6, n_post).clip(0, 8)

    cl_zscores = np.concatenate([get_cl_zscores, post_cl_zscores])
    param_density = np.concatenate([get_param_density, post_param_density])
    entropy = np.concatenate([get_entropy, post_entropy])

    # Shuffle so GET and POST are interleaved
    idx = rng.permutation(n_samples)
    return np.column_stack([cl_zscores[idx], param_density[idx], entropy[idx]])
