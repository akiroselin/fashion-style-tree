#!/usr/bin/env python3
"""Lightweight validator for fashion style-tree data (polytech-tree schema subset)."""
import json
import os
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
REQUIRED = ["id", "name", "nameEn", "wikiEn", "aliases", "year", "year_basis", "year_span",
            "year_note", "era", "category", "kind", "importance", "prereqs", "related", "desc"]
YEAR_BASIS = {"exact", "decade", "century", "circa", "range_midpoint", "scholarly_disputed",
              "convention_floor", "batch_asserted"}
KINDS = {"主风格", "变体", "趋势词", "亚文化", "地域流", "史服"}
errors, warnings = [], []


def era_deriver(era_list):
    ordered = sorted(era_list, key=lambda e: e["order"])

    def derive(year):
        for i, e in enumerate(ordered):
            last = i == len(ordered) - 1
            if e["yearStart"] <= year < e["yearEnd"] or (last and year == e["yearEnd"]):
                return e["id"]
        return None
    return derive


def main():
    techs = json.load(open(os.path.join(DATA, "techs.json"), encoding="utf-8"))
    eras = {e["id"]: e for e in json.load(open(os.path.join(DATA, "eras.json"), encoding="utf-8"))}
    cats = {c["id"]: c for c in json.load(open(os.path.join(DATA, "categories.json"), encoding="utf-8"))}
    derive = era_deriver(list(eras.values()))
    exempt = set(json.load(open(os.path.join(DATA, "wikien-none-allowlist.json"), encoding="utf-8")).get("items", []))

    ids = Counter(t["id"] for t in techs)
    for i, n in ids.items():
        if n > 1:
            errors.append(f"重复 id: {i}")

    idset = set(ids)
    year_of = {t["id"]: t["year"] for t in techs}
    for t in techs:
        rid = t["id"]
        for k in REQUIRED:
            if k not in t:
                errors.append(f"{rid}: 缺字段 {k}")
        if t.get("era") not in eras:
            errors.append(f"{rid}: 非法 era")
        if t.get("category") not in cats:
            errors.append(f"{rid}: 非法 category")
        if t.get("kind") not in KINDS:
            errors.append(f"{rid}: 非法 kind={t.get('kind')}")
        if not isinstance(t.get("importance"), int) or not (1 <= t["importance"] <= 5):
            errors.append(f"{rid}: 非法 importance")
        want = derive(t["year"])
        if want != t["era"]:
            errors.append(f"{rid}: era/year 不一致 want={want}")
        if t.get("year_basis") not in YEAR_BASIS:
            errors.append(f"{rid}: 非法 year_basis")
        if not t.get("wikiEn") and rid not in exempt:
            warnings.append(f"{rid}: wikiEn 为空")
        if not t.get("prereqs") and not t.get("related"):
            errors.append(f"{rid}: 孤立点")
        for p in t.get("prereqs") or []:
            if p not in idset:
                errors.append(f"{rid}: 悬空 prereq {p}")
            elif year_of[p] > t["year"]:
                errors.append(f"{rid}: 前置 {p} 年份更晚")
        for r in t.get("related") or []:
            if r not in idset:
                errors.append(f"{rid}: 悬空 related {r}")

    wk = Counter((t.get("wikiEn") or "").lower() for t in techs if t.get("wikiEn"))
    for k, v in wk.items():
        if v > 1:
            errors.append(f"wikiEn 重复: {k} x{v}")

    print(f"styles={len(techs)} eras={len(eras)} cats={len(cats)}")
    for w in warnings[:20]:
        print("WARN", w)
    for e in errors:
        print("ERR", e)
    if errors:
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
