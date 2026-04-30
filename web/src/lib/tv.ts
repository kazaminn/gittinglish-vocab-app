type VariantGroups = Record<string, Record<string, string>>;

type VariantSelection<TVariants extends VariantGroups> = {
  [TKey in keyof TVariants]?: keyof TVariants[TKey];
} & {
  className?: string;
};

interface TVConfig<TVariants extends VariantGroups> {
  base: string | string[];
  variants?: TVariants;
  defaultVariants?: {
    [TKey in keyof TVariants]?: keyof TVariants[TKey];
  };
}

function toClassArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function tv<TVariants extends VariantGroups>(
  config: TVConfig<TVariants>
) {
  return (selection: VariantSelection<TVariants> = {}): string => {
    const classes = [...toClassArray(config.base)];
    const variants = config.variants ?? ({} as TVariants);

    for (const variantName of Object.keys(variants) as (
      keyof TVariants & string
    )[]) {
      const variantMap = variants[variantName];
      if (!variantMap) continue;

      const selectedValue =
        selection[variantName] ?? config.defaultVariants?.[variantName];

      if (!selectedValue) continue;

      const variantClass = variantMap[selectedValue as string];
      if (variantClass) {
        classes.push(variantClass);
      }
    }

    if (selection.className) {
      classes.push(selection.className);
    }

    return classes.join(' ');
  };
}
